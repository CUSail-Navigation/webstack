const ROSLIB = require('roslib');
const Boat = require('../models/Boat');

const ROSBRIDGE_URL = process.env.ROSBRIDGE_URL || 'ws://localhost:9090';
let ros = null;
let waypointService = null;
let setModeService = null;
let webserverRudderTopic = null;
let webserverSailTopic = null;
let controlModeTopic = null;
let noGoZoneTopic = null;
let neutralZoneTopic = null;
let tackingBufferTopic = null;
let hsvLowerTopic = null;
let hsvUpperTopic = null;
let detectionThresholdTopic = null;
let isConnected = false;
let currentUrl = ROSBRIDGE_URL;

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
        name: '/actual_rudder_angle',
        messageType: 'std_msgs/msg/Int32',
        throttle_rate: 1000
    }, (message) => parseTopicMessage(message, 'actualRudderAngle'));

    subscribe({
        name: '/actual_mainsail_angle',
        messageType: 'std_msgs/msg/Int32',
        throttle_rate: 1000
    }, (message) => parseTopicMessage(message, 'actualSailAngle'));

    subscribe({
        name: '/sailbot/radio_rudder',
        messageType: 'std_msgs/msg/Int32',
        throttle_rate: 1000
    }, (message) => parseTopicMessage(message, 'radioRudder'));

    subscribe({
        name: '/sailbot/radio_sail',
        messageType: 'std_msgs/msg/Int32',
        throttle_rate: 1000
    }, (message) => parseTopicMessage(message, 'radioSail'));

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
        name: '/sailbot/current_mode',
        messageType: 'std_msgs/msg/String',
        throttle_rate: 1000
    }, (message) => parseTopicMessage(message, 'eventMode'));

    subscribe({
        name: '/rudder_angle',
        messageType: 'std_msgs/msg/Int32',
        throttle_rate: 1000
    }, (message) => parseTopicMessage(message, 'rudderAngle'));

    subscribe({
        name: '/mainsail_angle',
        messageType: 'std_msgs/msg/Int32',
        throttle_rate: 1000
    }, (message) => parseTopicMessage(message, 'sailAngle'));

    subscribe({
        name: '/dropped_packets',
        messageType: 'std_msgs/msg/Int32',
        throttle_rate: 1000
    }, (message) => parseTopicMessage(message, 'droppedPackets'));


    waypointService = new ROSLIB.Service({
        ros,
        name: '/mutate_waypoint_queue',
        serviceType: 'interface/srv/Waypoint'
    });

    setModeService = new ROSLIB.Service({
        ros,
        name: 'sailbot/set_mode',
        serviceType: 'sailboat_interface/srv/SetModeWithParams'
    });

    webserverRudderTopic = new ROSLIB.Topic({
        ros,
        name: '/rudder_angle',
        messageType: 'std_msgs/msg/Int32'
    });

    webserverSailTopic = new ROSLIB.Topic({
        ros,
        name: '/mainsail_angle',
        messageType: 'std_msgs/msg/Int32'
    });

    controlModeTopic = new ROSLIB.Topic({
        ros,
        name: '/sailbot/control_mode',
        messageType: 'std_msgs/msg/String'
    });

    noGoZoneTopic = new ROSLIB.Topic({
        ros,
        name: '/sailbot/no_go_zone',
        messageType: 'std_msgs/msg/Int32'
    });

    neutralZoneTopic = new ROSLIB.Topic({
        ros,
        name: '/sailbot/neutral_zone',
        messageType: 'std_msgs/msg/Int32'
    });

    tackingBufferTopic = new ROSLIB.Topic({
        ros,
        name: '/sailbot/tacking_buffer',
        messageType: 'std_msgs/msg/Int32'
    });

    hsvLowerTopic = new ROSLIB.Topic({
        ros,
        name: '/sailbot/update_hsv_lower',
        messageType: 'std_msgs/msg/Int32MultiArray'
    });

    hsvUpperTopic = new ROSLIB.Topic({
        ros,
        name: '/sailbot/update_hsv_upper',
        messageType: 'std_msgs/msg/Int32MultiArray'
    });

    detectionThresholdTopic = new ROSLIB.Topic({
        ros,
        name: '/sailbot/update_detection_threshold',
        messageType: 'std_msgs/msg/Int32'
    });

    subscribe({
        name: '/sailbot/buoy_distance',
        messageType: 'std_msgs/msg/Float32',
        throttle_rate: 1000
    }, (message) => parseTopicMessage(message, 'buoyDistance'));
};

const connectROS = (rosbridgeUrl = ROSBRIDGE_URL) => {
    if (ros) {
        return ros;
    }

    log('Connecting to ROS at', rosbridgeUrl);
    currentUrl = rosbridgeUrl;
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

// Tear down the current rosbridge connection (if any) and open a new one at
// `rosbridgeUrl` — lets the web UI point at a different rosbridge at runtime,
// mirroring the old dashboard's "ros-url" connect field.
const reconnectROS = (rosbridgeUrl) => {
    if (ros) {
        ros.close();
        ros = null;
        isConnected = false;
    }
    return connectROS(rosbridgeUrl);
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

const sendManualControl = ({ rudder, sail }) => {
    if (!isConnected) {
        throw new Error('ROS is not connected');
    }

    if (typeof rudder === 'number' && webserverRudderTopic) {
        webserverRudderTopic.publish(new ROSLIB.Message({ data: Math.round(rudder) }));
    }

    if (typeof sail === 'number' && webserverSailTopic) {
        webserverSailTopic.publish(new ROSLIB.Message({ data: Math.round(sail) }));
    }
};

const VALID_MODES = ['algo', 'radio', 'webserver', 'controller_app'];

const setControlMode = (mode) => {
    if (!isConnected || !controlModeTopic) {
        throw new Error('ROS is not connected');
    }

    const normalized = String(mode).toLowerCase();
    if (!VALID_MODES.includes(normalized)) {
        throw new Error(`Unknown mode "${mode}". Expected one of: ${VALID_MODES.join(', ')}`);
    }

    controlModeTopic.publish(new ROSLIB.Message({ data: normalized }));
    log('Published control mode', normalized);
    return normalized;
};

const publishIntTopic = (topic, name, value) => {
    if (!isConnected || !topic) {
        throw new Error('ROS is not connected');
    }
    const intValue = parseInt(value, 10);
    if (Number.isNaN(intValue)) {
        throw new Error(`${name} must be an integer`);
    }
    topic.publish(new ROSLIB.Message({ data: intValue }));
    log(`Published ${name}`, intValue);
    return intValue;
};

const setNoGoZone = (value) => publishIntTopic(noGoZoneTopic, 'no_go_zone', value);
const setNeutralZone = (value) => publishIntTopic(neutralZoneTopic, 'neutral_zone', value);
const setTackingBuffer = (value) => publishIntTopic(tackingBufferTopic, 'tacking_buffer', value);

const callSetMode = (request) => {
    if (!isConnected || !setModeService) {
        return Promise.reject(new Error('ROS is not connected'));
    }
    return new Promise((resolve, reject) => {
        setModeService.callService(new ROSLIB.ServiceRequest(request), (result) => {
            if (result && result.success) {
                log('set_mode succeeded', request.mode, result.message);
                resolve(result);
            } else {
                reject(new Error((result && result.message) || `Failed to set mode "${request.mode}"`));
            }
        }, (error) => {
            reject(error instanceof Error ? error : new Error(String(error)));
        });
    });
};

// corners: array of 4 { latitude, longitude } objects, in order.
const activateStationKeeping = (corners) => {
    if (!Array.isArray(corners) || corners.length !== 4) {
        return Promise.reject(new Error('Station keeping requires exactly 4 corners'));
    }
    const station_rect_points = corners.map(({ latitude, longitude }) => {
        if (typeof latitude !== 'number' || typeof longitude !== 'number') {
            throw new Error('Each corner must have numeric latitude and longitude');
        }
        return { x: longitude, y: latitude, z: 0.0 };
    });

    return callSetMode({
        mode: 'station_keeping',
        station_rect_points,
        search_center_point: { x: 0.0, y: 0.0, z: 0.0 }
    });
};

// Shared "cancel back to manual" used by both station keeping and CV mode.
const setManualMode = () => callSetMode({ mode: 'manual' });

const activateCV = () => callSetMode({ mode: 'search' });

const publishHsv = (topic, name, values) => {
    if (!isConnected || !topic) {
        throw new Error('ROS is not connected');
    }
    if (!Array.isArray(values) || values.length !== 3 || values.some((v) => !Number.isFinite(v))) {
        throw new Error(`${name} must be an array of 3 numbers`);
    }
    const data = values.map((v) => Math.round(v));
    topic.publish(new ROSLIB.Message({ data }));
    log(`Published ${name}`, data);
    return data;
};

const setHsvLower = (values) => publishHsv(hsvLowerTopic, 'hsv_lower', values);
const setHsvUpper = (values) => publishHsv(hsvUpperTopic, 'hsv_upper', values);
const setDetectionThreshold = (value) => publishIntTopic(detectionThresholdTopic, 'detection_threshold', value);

const getStatus = () => ({ connected: isConnected, url: currentUrl });

module.exports = {
    connectROS,
    reconnectROS,
    sendWaypointToRobot,
    sendManualControl,
    setControlMode,
    setNoGoZone,
    setNeutralZone,
    setTackingBuffer,
    activateStationKeeping,
    setManualMode,
    activateCV,
    setHsvLower,
    setHsvUpper,
    setDetectionThreshold,
    getStatus
};