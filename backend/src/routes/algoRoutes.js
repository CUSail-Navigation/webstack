const express = require('express');
const router = express.Router();
const { setNoGoZone, setNeutralZone, setTackingBuffer, setHsvLower, setHsvUpper, setDetectionThreshold } = require('../services/rosService');

// Algorithm runtime parameters — no-go zone / neutral zone / tacking buffer.
// Each just forwards an integer to the matching ROS topic; nothing is
// persisted since the boat's ROS nodes hold this state, not the webserver.
function makeIntParamRoute(setter) {
    return async (req, res) => {
        const { value } = req.body;
        if (value === undefined) {
            return res.status(400).json({ error: 'Request must include value' });
        }
        try {
            const published = setter(value);
            res.status(200).json({ value: published });
        } catch (err) {
            res.status(502).json({ error: err.message });
        }
    };
}

router.post('/no-go-zone', makeIntParamRoute(setNoGoZone));
router.post('/neutral-zone', makeIntParamRoute(setNeutralZone));
router.post('/tacking-buffer', makeIntParamRoute(setTackingBuffer));

// CV tuning params — HSV lower/upper (3-value arrays) and detection threshold.
function makeHsvRoute(setter) {
    return async (req, res) => {
        const { values } = req.body;
        try {
            const published = setter(values);
            res.status(200).json({ values: published });
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    };
}

router.post('/hsv-lower', makeHsvRoute(setHsvLower));
router.post('/hsv-upper', makeHsvRoute(setHsvUpper));
router.post('/detection-threshold', makeIntParamRoute(setDetectionThreshold));

module.exports = router;
