const { randomUUID } = require('node:crypto');
const Queue = require('../models/WaypointQueue');
const ros = require('./rosService');

const fail = (status, message) => Object.assign(new Error(message), { status });
const toItems = (state) => state.waypoints.map(({ id, latitude, longitude }, order) =>
    ({ _id: id, latitude, longitude, order }));

// One backend process serializes reads, edits, and cache writes. Only the boat
// owns the queue; the database is never used to restore or replace boat state.
let tail = Promise.resolve();
let refreshing = null;
let lastError = null;
const serialize = (operation) => {
    const result = tail.then(operation);
    tail = result.catch(() => {});
    return result;
};
const request = async (command, argument) => {
    if (!ros.getStatus().connected) throw fail(503, 'Boat is disconnected');
    const { version, waypoints } = await ros.callWaypointService(command, argument);
    return { version, waypoints };
};
const save = async (state) => {
    await Queue.replaceOne({ _id: 'mission' },
        { _id: 'mission', waypoints: toItems(state), confirmedAt: new Date() },
        { upsert: true, runValidators: true });
    lastError = null;
};

function refresh() {
    if (!refreshing) {
        refreshing = serialize(async () => {
            try { await save(await request('get')); }
            catch (error) { lastError = error.message; }
        }).finally(() => { refreshing = null; });
    }
    return refreshing;
}

function edit(change) {
    return serialize(async () => {
        let state;
        try {
            const previous = await request('get');
            state = await request('set', {
                expected_version: previous.version, waypoints: change(previous.waypoints)
            });
        } catch (error) {
            lastError = error.message;
            throw error; // Never replay an edit, even if its acknowledgement was lost.
        }
        let warning;
        try { await save(state); }
        catch (error) {
            lastError = error.message;
            warning = 'Boat accepted the edit, but the saved queue could not be updated. Refresh will retry.';
        }
        return { waypoints: toItems(state), ...(warning && { warning }) };
    });
}

module.exports = {
    refresh,
    list: async () => (await Queue.findById('mission').lean())?.waypoints || [],
    status: async () => {
        const snapshot = await Queue.findById('mission').lean();
        const confirmedAt = snapshot?.confirmedAt || null;
        return {
            connected: ros.getStatus().connected,
            stale: !ros.getStatus().connected || Boolean(lastError) || !confirmedAt ||
                Date.now() - new Date(confirmedAt).getTime() > 5000,
            confirmedAt, error: lastError
        };
    },
    add: async ({ latitude, longitude } = {}) => {
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude) ||
            Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
            throw fail(400, 'Invalid latitude or longitude');
        }
        const id = randomUUID();
        const result = await edit((items) => [...items, { id, latitude, longitude }]);
        return { ...result.waypoints.find((w) => w._id === id),
            ...(result.warning && { warning: result.warning }) };
    },
    remove: (id) => edit((items) => items.filter((w) => w.id !== id)),
    clear: () => edit(() => []),
    reorder: (ids) => {
        if (!Array.isArray(ids) || ids.some((id) => typeof id !== 'string') ||
            new Set(ids).size !== ids.length) {
            return Promise.reject(fail(400, 'Expected a unique array of waypoint IDs'));
        }
        return edit((items) => {
            if (ids.length !== items.length || ids.some((id) => !items.some((w) => w.id === id))) {
                throw fail(409, 'Queue changed; refresh before reordering');
            }
            return ids.map((id) => items.find((w) => w.id === id));
        });
    }
};
