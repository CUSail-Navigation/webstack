const router = require('express').Router();
const queue = require('../services/waypointQueue');

const handle = (fn) => async (req, res) => {
    try { await fn(req, res); }
    catch (error) { res.status(error.status || 500).json({ error: error.message }); }
};

router.get('/', handle(async (req, res) => res.json(await queue.list())));
router.get('/status', handle(async (req, res) => res.json(await queue.status())));

// Success acknowledges the boat, not a saved edit awaiting delivery.
router.post('/', handle(async (req, res) => {
    res.status(201).json(await queue.add(req.body));
}));
router.put('/reorder', handle(async (req, res) => {
    res.json(await queue.reorder(req.body?.orderedIds));
}));
router.delete('/clear', handle(async (req, res) => {
    res.json(await queue.clear());
}));
router.delete('/:id', handle(async (req, res) => {
    res.json(await queue.remove(req.params.id));
}));

module.exports = router;
