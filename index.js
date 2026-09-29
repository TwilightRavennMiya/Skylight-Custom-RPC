(() => {
    const { metro, ui, storage: storageApi } = vendetta;
    const { React, ReactNative, FluxDispatcher } = metro.common;
    const { FormSwitchRow, FormRow, FormInput, FormSection } = ui.components.Forms;
    const store = vendetta.plugin.storage;

    store.mode ??= "manual";
    store.running ??= false;
    store.name ??= "Custom RPC";
    store.applicationId ??= "";
    store.details ??= "";
    store.state ??= "";
    store.largeImage ??= "";
    store.largeText ??= "";
    store.smallImage ??= "";
    store.smallText ??= "";
    store.timestamp ??= false;
    store.button1Label ??= "";
    store.button1Url ??= "";
    store.button2Label ??= "";
    store.button2Url ??= "";

    function makeActivity() {
        const a = {
            name: store.name,
            application_id: store.applicationId,
            type: 0,
            details: store.details,
            state: store.state
        };
        if (store.largeImage || store.largeText || store.smallImage || store.smallText) {
            a.assets = {
                large_image: store.largeImage,
                large_text: store.largeText,
                small_image: store.smallImage,
                small_text: store.smallText
            };
        }
        if (store.timestamp) a.timestamps = { start: Date.now() };

        const buttons = [
            [store.button1Label, store.button1Url],
            [store.button2Label, store.button2Url]
        ].filter(x => x[0] && /^https?:\/\//i.test(x[1] || ""));

        if (buttons.length) {
            a.buttons = buttons.map(x => x[0]);
            a.metadata = { button_urls: buttons.map(x => x[1]) };
        }
        return a;
    }

    function start() {
        store.running = true;
        try {
            FluxDispatcher.dispatch({
                type: "LOCAL_ACTIVITY_UPDATE",
                activity: makeActivity(),
                pid: 1608,
                socketId: "SkylightCustomRPC"
            });
        } catch (_) {}
    }

    function end() {
        store.running = false;
        try {
            FluxDispatcher.dispatch({
                type: "LOCAL_ACTIVITY_UPDATE",
                activity: null,
                pid: 1608,
                socketId: "SkylightCustomRPC"
            });
        } catch (_) {}
    }

    function Input(title, key, keyboardType) {
        return React.createElement(FormInput, {
            title,
            value: String(store[key] ?? ""),
            onChange: value => { store[key] = value; },
            keyboardType
        });
    }

    function Settings() {
        storageApi.useProxy(store);

        return React.createElement(
            ReactNative.ScrollView,
            null,
            React.createElement(FormSection, { title: "RPC Controls" },
                React.createElement(FormRow, {
                    label: store.running ? "RPC Running" : "Start RPC",
                    subLabel: "Start your custom presence",
                    onPress: start
                }),
                React.createElement(FormRow, {
                    label: "End RPC",
                    subLabel: "Stop your custom presence",
                    onPress: end
                }),
                React.createElement(FormSwitchRow, {
                    label: "Automatic RPC",
                    subLabel: "Start automatically when the plugin loads",
                    value: store.mode === "automatic",
                    onValueChange: value => {
                        store.mode = value ? "automatic" : "manual";
                        value ? start() : end();
                    }
                })
            ),
            React.createElement(FormSection, { title: "Basic" },
                Input("Name", "name"),
                Input("Application ID", "applicationId", "numeric"),
                Input("Details", "details"),
                Input("State", "state")
            ),
            React.createElement(FormSection, { title: "Images" },
                Input("Large Image", "largeImage"),
                Input("Large Image Hover Text", "largeText"),
                Input("Small Image", "smallImage"),
                Input("Small Image Hover Text", "smallText")
            ),
            React.createElement(FormSection, { title: "Timestamp" },
                React.createElement(FormSwitchRow, {
                    label: "Enable timestamp",
                    value: store.timestamp,
                    onValueChange: value => { store.timestamp = value; }
                })
            ),
            React.createElement(FormSection, { title: "Buttons" },
                Input("Button 1 Label", "button1Label"),
                Input("Button 1 URL", "button1Url"),
                Input("Button 2 Label", "button2Label"),
                Input("Button 2 URL", "button2Url")
            )
        );
    }

    return {
        onLoad() {
            if (store.mode === "automatic") start();
        },
        onUnload() {
            end();
        },
        settings: Settings
    };
})()
