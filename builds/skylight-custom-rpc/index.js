(function () {
  const { FluxDispatcher, React, ReactNative } = vendetta.metro.common;
  const { storage } = vendetta.plugin;

  const s = storage;
  s.mode ??= "manual";
  s.running ??= false;
  s.activity ??= {
    name: "Custom RPC",
    application_id: "",
    type: 0,
    details: "",
    state: "",
    timestamps: { enabled: false, start: Date.now() },
    assets: { large_image: "", large_text: "", small_image: "", small_text: "" },
    buttons: [{ label: "", url: "" }, { label: "", url: "" }]
  };

  let unloaded = false;

  function clean(o) {
    if (o == null) return undefined;
    if (typeof o === "string" && !o.trim()) return undefined;
    if (Array.isArray(o)) {
      const a = o.map(clean).filter(x => x !== undefined);
      return a.length ? a : undefined;
    }
    if (typeof o === "object") {
      const r = {};
      for (const k in o) {
        if (k === "enabled") continue;
        const x = clean(o[k]);
        if (x !== undefined) r[k] = x;
      }
      return Object.keys(r).length ? r : undefined;
    }
    return o;
  }

  function makeActivity() {
    const a = JSON.parse(JSON.stringify(s.activity));
    if (a.timestamps && a.timestamps.enabled) {
      a.timestamps.start = a.timestamps.start || Date.now();
      delete a.timestamps.enabled;
    } else {
      delete a.timestamps;
    }
    const bs = (a.buttons || []).filter(b => b && b.label && /^https?:\\/\\//i.test(b.url || ""));
    if (bs.length) {
      a.metadata = { button_urls: bs.map(b => b.url) };
      a.buttons = bs.map(b => b.label);
    } else {
      delete a.buttons;
    }
    return clean(a);
  }

  function clear() {
    try {
      FluxDispatcher.dispatch({
        type: "LOCAL_ACTIVITY_UPDATE",
        activity: null,
        pid: 1608,
        socketId: "SkylightCustomRPC"
      });
    } catch (_) {}
  }

  function start() {
    if (unloaded) return;
    s.running = true;
    try {
      FluxDispatcher.dispatch({
        type: "LOCAL_ACTIVITY_UPDATE",
        activity: makeActivity(),
        pid: 1608,
        socketId: "SkylightCustomRPC"
      });
    } catch (_) {
      s.running = false;
    }
  }

  function end() {
    s.running = false;
    clear();
  }

  function Button(title, onPress) {
    return React.createElement(
      ReactNative.TouchableOpacity,
      {
        onPress,
        style: {
          padding: 14,
          marginVertical: 5,
          borderRadius: 10,
          backgroundColor: "#5865F2"
        }
      },
      React.createElement(
        ReactNative.Text,
        { style: { color: "#fff", fontWeight: "600", textAlign: "center" } },
        title
      )
    );
  }

  function Input(title, value, onChange, keyboardType) {
    return React.createElement(
      ReactNative.View,
      { style: { marginBottom: 10 } },
      React.createElement(
        ReactNative.Text,
        { style: { color: "#fff", fontSize: 15, marginBottom: 5 } },
        title
      ),
      React.createElement(ReactNative.TextInput, {
        value: value == null ? "" : String(value),
        onChangeText: onChange,
        keyboardType,
        placeholderTextColor: "#999",
        style: {
          color: "#fff",
          backgroundColor: "#2b2d31",
          borderRadius: 8,
          paddingHorizontal: 12,
          paddingVertical: 10
        }
      })
    );
  }

  function Settings() {
    const [, force] = React.useState(0);
    const refresh = () => force(x => x + 1);

    return React.createElement(
      ReactNative.ScrollView,
      { contentContainerStyle: { padding: 16, paddingBottom: 40 } },
      React.createElement(
        ReactNative.Text,
        { style: { color: "#fff", fontSize: 22, fontWeight: "700", marginBottom: 12 } },
        "Skylight Custom RPC"
      ),
      Button(s.running ? "RPC Running" : "Start RPC", () => { start(); refresh(); }),
      Button("End RPC", () => { end(); refresh(); }),
      React.createElement(
        ReactNative.View,
        { style: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginVertical: 12 } },
        React.createElement(ReactNative.Text, { style: { color: "#fff", fontSize: 16 } }, "Automatic RPC"),
        React.createElement(ReactNative.Switch, {
          value: s.mode === "automatic",
          onValueChange: v => {
            s.mode = v ? "automatic" : "manual";
            v ? start() : end();
            refresh();
          }
        })
      ),
      Input("Name", s.activity.name, v => { s.activity.name = v; refresh(); }),
      Input("Application ID", s.activity.application_id, v => { s.activity.application_id = v; refresh(); }, "numeric"),
      Input("Activity Type (0/1/2/3/5)", s.activity.type, v => { s.activity.type = Number(v) || 0; refresh(); }, "numeric"),
      Input("Details", s.activity.details, v => { s.activity.details = v; refresh(); }),
      Input("State", s.activity.state, v => { s.activity.state = v; refresh(); }),
      Input("Large Image", s.activity.assets.large_image, v => { s.activity.assets.large_image = v; refresh(); }),
      Input("Large Image Hover Text", s.activity.assets.large_text, v => { s.activity.assets.large_text = v; refresh(); }),
      Input("Small Image", s.activity.assets.small_image, v => { s.activity.assets.small_image = v; refresh(); }),
      Input("Small Image Hover Text", s.activity.assets.small_text, v => { s.activity.assets.small_text = v; refresh(); }),
      React.createElement(
        ReactNative.View,
        { style: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginVertical: 12 } },
        React.createElement(ReactNative.Text, { style: { color: "#fff", fontSize: 16 } }, "Enable timestamp"),
        React.createElement(ReactNative.Switch, {
          value: !!s.activity.timestamps.enabled,
          onValueChange: v => {
            s.activity.timestamps.enabled = v;
            if (v) s.activity.timestamps.start = Date.now();
            refresh();
          }
        })
      ),
      Input("Button 1 Label", s.activity.buttons[0].label, v => { s.activity.buttons[0].label = v; refresh(); }),
      Input("Button 1 URL", s.activity.buttons[0].url, v => { s.activity.buttons[0].url = v; refresh(); }),
      Input("Button 2 Label", s.activity.buttons[1].label, v => { s.activity.buttons[1].label = v; refresh(); }),
      Input("Button 2 URL", s.activity.buttons[1].url, v => { s.activity.buttons[1].url = v; refresh(); }),
      React.createElement(
        ReactNative.Text,
        { style: { color: "#aaa", fontSize: 13, marginTop: 12 } },
        "Changes save automatically. Press Start RPC after editing."
      )
    );
  }

  return {
    onLoad() {
      unloaded = false;
      if (s.mode === "automatic" || s.running) start();
    },
    onUnload() {
      unloaded = true;
      end();
    },
    settings: Settings
  };
})()