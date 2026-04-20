const ROSLIB = require('roslib');
const Boat = require('../models/Boat');

const ROSBRIDGE_URL = process.env.ROSBRIDGE_URL || 'ws://localhost:9090';
let ros = null;
let waypointService = null;
let isConnected = false;

const log = (...args) => {
    console.log('[ROS SERVICE]', ...args);
};

const updateBoatState = async (fields) => {
    try {
        await Boat.findOneAndUpdate(
            {},
            { $set: { ...fields, updatedAt: new Date() } },
            { upsert: true, new: true, runValidators: true }
        );
    } catch (err) {
        console.warn('[ROS SERVICE] Failed to update boat state:', err.message);
    }
};

const parseGpsMessage = async (message) => {
    if (typeof message.latitude !== 'number' || typeof message.longitude !== 'number') {
        return;
    }
    log('GPS update', message.latitude, message.longitude);
    await updateBoatState({ latitude: message.latitude, longitude: message.longitude });
};

const parseImuMessage = async (message) => {
    let heading = null;

    if (message.angular_velocity && typeof message.angular_velocity.z === 'number') {
        heading = message.angular_velocity.z;
    } else if (typeof message.z === 'number') {
        heading = message.z;
    }

    if (heading === null) {
        return;
    }

    log('IMU heading update', heading);
    await updateBoatState({ heading });
};

const parseTopicMessage = async (message, fieldName, transform) => {
    if (!message || typeof message.data === 'undefined') {
        return;
    }

    let rawValue = message.data;
    if (typeof rawValue === 'string') {
        rawValue = rawValue.trim();
    }

    if (typeof rawValue !== 'number' && typeof rawValue !== 'string') {
        return;
    }

    const value = transform ? transform(rawValue) : rawValue;
    log(`${fieldName} update`, value);
    await updateBoatState({ [fieldName]: value });
};

const parseAlgoDebug = async (message) => {
    if (!message) return;

    const update = {};

    if (typeof message.tacking === 'boolean') {
        update.tacking = message.tacking;
    }
    if (message.dist_to_dest && typeof message.dist_to_dest.data === 'number') {
        update.distToDest = message.dist_to_dest.data;
    }
    if (message.curr_dest && typeof message.curr_dest.latitude === 'number' && typeof message.curr_dest.longitude === 'number') {
        update.targetRudderAngle = message.curr_dest.latitude; // preserve raw debug values if needed
        update.targetSailAngle = message.curr_dest.longitude;
    }

    if (Object.keys(update).length > 0) {
        log('AlgoDebug update', update);
        await updateBoatState(update);
    }
};

const initTopics = () => {
    if (!ros) return;

    const subscribe = (topicOptions, callback) => {
        const topic = new ROSLIB.Topic({ ros, ...topicOptions });
        topic.subscribe(callback);
        return topic;
    };

    subscribe({
        name: '/gps',
        messageType: 'sensor_msgs/msg/NavSatFix',
        throttle_rate: 1000
    }, parseGpsMessage);

    subscribe({
        name: '/imu',
        messageType: 'sensor_msgs/msg/Imu',
        throttle_rate: 1000
    }, parseImuMessage);

    subscribe({
        name: '/sailbot/algo_rudder',
        messageType: 'std_msgs/msg/Int32',
        throttle_rate: 1000
    }, (message) => parseTopicMessage(message, 'algoRudder'));

    subscribe({
        name: '/sailbot/algo_sail',
        messageType: 'std_msgs/msg/Int32',
        throttle_rate: 1000
    }, (message) => parseTopicMessage(message, 'algoSail'));

    subscribe({
        name: '/sailbot/actual_rudder_angle',
        messageType: 'std_msgs/msg/Int32',
        throttle_rate: 1000
    }, (message) => parseTopicMessage(message, 'actualRudderAngle', (value) => value - 25));

    subscribe({
        name: '/sailbot/actual_sail_angle',
        messageType: 'std_msgs/msg/Int32',
        throttle_rate: 1000
    }, (message) => parseTopicMessage(message, 'actualSailAngle'));

    subscribe({
        name: '/sailbot/wind',
        messageType: 'std_msgs/msg/Int32',
        throttle_rate: 1000
    }, (message) => parseTopicMessage(message, 'windAngle'));

    subscribe({
        name: '/sailbot/control_mode',
        messageType: 'std_msgs/msg/String',
        throttle_rate: 1000
    }, (message) => parseTopicMessage(message, 'controlMode'));

    subscribe({
        name: '/sailbot/dropped_packets',
        messageType: 'std_msgs/msg/Int32',
        throttle_rate: 1000
    }, (message) => parseTopicMessage(message, 'droppedPackets'));

    subscribe({
        name: '/sailbot/main_algo_debug',
        messageType: 'sailboat_interface/msg/AlgoDebug',
        throttle_rate: 1000
    }, parseAlgoDebug);

    waypointService = new ROSLIB.Service({
        ros,
        name: '/sailbot/mutate_waypoint_queue',
        serviceType: 'sailboat_interface/srv/Waypoint'
    });
};

const connectROS = (rosbridgeUrl = ROSBRIDGE_URL) => {
    if (ros) {
        return ros;
    }

    log('Connecting to ROS at', rosbridgeUrl);
    ros = new ROSLIB.Ros({ url: rosbridgeUrl });

    ros.on('connection', () => {
        isConnected = true;
        log('Connected to ROS bridge');
        initTopics();
    });

    ros.on('error', (error) => {
        isConnected = false;
        console.error('[ROS SERVICE] rosbridge error:', error);
    });

    ros.on('close', () => {
        isConnected = false;
        log('ROS bridge connection closed');
    });

    return ros;
};

const sendWaypointToRobot = async (waypointData) => {
    if (!waypointService || !isConnected) {
        throw new Error('ROS is not connected or waypoint service is unavailable');
    }

    if (typeof waypointData.latitude !== 'number' || typeof waypointData.longitude !== 'number') {
        throw new Error('Waypoint must contain numeric latitude and longitude');
    }

    const request = new ROSLIB.ServiceRequest({
        command: 'set',
        argument: `${waypointData.latitude},${waypointData.longitude}`
    });

    return new Promise((resolve, reject) => {
        waypointService.callService(request, (result) => {
            if (result && result.success) {
                log('Waypoint service accepted', waypointData);
                resolve(result);
            } else {
                const message = result && result.message ? result.message : 'unknown error';
                reject(new Error(`Waypoint service failed: ${message}`));
            }
        }, (error) => {
            reject(error || new Error('Waypoint service call error'));
        });
    });
};

const getStatus = () => ({ connected: isConnected, url: ROSBRIDGE_URL });

module.exports = {
    connectROS,
    sendWaypointToRobot,
    getStatus
};