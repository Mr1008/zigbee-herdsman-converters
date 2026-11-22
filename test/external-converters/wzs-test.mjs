import * as exposes from "zigbee-herdsman-converters/lib/exposes";
import * as tuya from "zigbee-herdsman-converters/lib/tuya";

const e = exposes.presets;
const ea = exposes.access;

const rawBase64 = {
    from: (value) => Buffer.from(value).toString("base64"),
    to: (value) => Array.from(Buffer.from(value, "base64")),
};

const workMode = tuya.valueConverterBasic.lookup({
    white: tuya.enum(0),
    colour: tuya.enum(1),
    scene: tuya.enum(2),
    music: tuya.enum(3),
});

const commonExposes = [
    e.binary("switch_led", ea.STATE_SET, true, false).withDescription("Turns the light on or off"),
    e
        .enum("work_mode", ea.STATE_SET, ["white", "colour", "scene", "music"])
        .withDescription("Selects white light, colour light, scene playback, or music-reactive lighting"),
    e.numeric("bright_value", ea.STATE_SET).withValueMin(10).withValueMax(1000).withDescription("Brightness value used by the Tuya app (10-1000)"),
    e
        .numeric("temp_value", ea.STATE_SET)
        .withValueMin(0)
        .withValueMax(1000)
        .withDescription("White-light colour temperature value used by the Tuya app (0-1000)"),
    e.text("scene_data", ea.STATE_SET).withDescription("Encoded lighting scene data (hexadecimal string)"),
    e
        .numeric("countdown", ea.STATE_SET)
        .withUnit("s")
        .withValueMin(0)
        .withValueMax(86400)
        .withDescription("Remaining countdown time"),
    e.text("control_data", ea.SET).withDescription("Transient lighting adjustment data for real-time preview (hexadecimal string)"),
    e
        .numeric("zll_value", ea.STATE_SET)
        .withUnit("dBm")
        .withValueMin(-65)
        .withValueMax(-45)
        .withDescription("Zigbee Light Link signal threshold used when pairing a Zigbee remote")
        .withCategory("config"),
];

export default [
    {
        fingerprint: [{modelID: "TS0505B", manufacturerName: "_TZB210_3zfp8mki"}],
        model: "ZBS-RGB+CCT",
        vendor: "Tuya",
        description: "WZS5 Zigbee RGB+CCT LED controller",
        extend: [
            tuya.modernExtend.tuyaLight({
                colorTemp: {range: [153, 500]},
                color: {modes: ["hs"], applyRedFix: true, enhancedHue: false},
                effect: false,
                doNotDisturb: false,
            }),
            tuya.modernExtend.tuyaBase({dp: true}),
        ],
        exposes: [
            ...commonExposes,
            e.text("colour_data", ea.STATE_SET).withDescription("Colour in hexadecimal form: 16-bit hue, saturation, and value fields"),
            e.text("music_data", ea.SET).withDescription("Music-reactive lighting data generated from the audio rhythm (hexadecimal string)"),
        ],
        meta: {
            tuyaDatapoints: [
                [1, "switch_led", tuya.valueConverter.onOff],
                [2, "work_mode", workMode],
                [3, "bright_value", tuya.valueConverter.raw],
                [4, "temp_value", tuya.valueConverter.raw],
                [5, "colour_data", tuya.valueConverter.raw],
                [6, "scene_data", tuya.valueConverter.raw],
                [7, "countdown", tuya.valueConverter.raw],
                [8, "music_data", tuya.valueConverter.raw],
                [9, "control_data", tuya.valueConverter.raw],
                [81, "zll_value", tuya.valueConverter.raw],
            ],
        },
        configure: (device) => {
            device.getEndpoint(1).saveClusterAttributeKeyValue("lightingColorCtrl", {colorCapabilities: 29});
        },
    },
    {
        fingerprint: [{modelID: "TS0502B", manufacturerName: "_TZ3210_3folyaq6"}],
        model: "ZBS-CCT",
        vendor: "Tuya",
        description: "WZS2 Zigbee CCT LED controller",
        extend: [
            tuya.modernExtend.tuyaLight({
                colorTemp: {range: [153, 500]},
                configureReporting: true,
                effect: false,
                doNotDisturb: false,
            }),
            tuya.modernExtend.tuyaBase({dp: true}),
        ],
        exposes: [
            ...commonExposes,
            e
                .binary("do_not_disturb", ea.STATE_SET, true, false)
                .withDescription(
                    "Prevents the light from turning on after a power outage; after an app-off command, two consecutive power-ons are needed",
                ),
            e
                .text("rhythm_mode", ea.STATE_SET)
                .withDescription(
                    "Automatically adjusts colour temperature and brightness through the day to follow a human circadian rhythm; raw payload is base64",
                ),
            e.text("sleep_mode", ea.STATE_SET).withDescription("Gradually fades the light to help you fall asleep; raw payload is base64"),
            e.text("wakeup_mode", ea.STATE_SET).withDescription("Gradually brightens the light to help you wake up; raw payload is base64"),
            e
                .text("power_memory", ea.STATE_SET)
                .withDescription("Sets the light state restored after power returns (does not remember app-off actions); raw payload is base64"),
            e
                .text("switch_gradient", ea.STATE_SET)
                .withDescription("Sets fade times for power-on/app-on and app-off transitions; raw payload is base64"),
            e.text("cycle_timing", ea.STATE_SET).withDescription("Repeats scheduled on/off cycles, e.g. for plant lighting; raw payload is base64"),
            e
                .text("random_timing", ea.STATE_SET)
                .withDescription("Randomly switches the light on and off to simulate someone being home; raw payload is base64"),
        ],
        meta: {
            tuyaDatapoints: [
                [1, "switch_led", tuya.valueConverter.onOff],
                [2, "work_mode", workMode],
                [3, "bright_value", tuya.valueConverter.raw],
                [4, "temp_value", tuya.valueConverter.raw],
                [6, "scene_data", tuya.valueConverter.raw],
                [7, "countdown", tuya.valueConverter.raw],
                [9, "control_data", tuya.valueConverter.raw],
                [30, "rhythm_mode", rawBase64],
                [31, "sleep_mode", rawBase64],
                [32, "wakeup_mode", rawBase64],
                [33, "power_memory", rawBase64],
                [34, "do_not_disturb", tuya.valueConverter.onOff],
                [35, "switch_gradient", rawBase64],
                [81, "zll_value", tuya.valueConverter.raw],
                [209, "cycle_timing", rawBase64],
                [210, "random_timing", rawBase64],
            ],
        },
        configure: async (device, coordinatorEndpoint) => {
            device.getEndpoint(1).saveClusterAttributeKeyValue("lightingColorCtrl", {colorCapabilities: 16});
            await tuya.configureMagicPacket(device, coordinatorEndpoint);
        },
    },
];
