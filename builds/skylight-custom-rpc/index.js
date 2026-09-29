// Skylight Custom RPC - single-file Revenge plugin
// Features: Start RPC, End RPC, Automatic RPC, editable presence settings.

const { FluxDispatcher } = vendetta.metro.common;
const { storage } = vendetta.plugin;
const { ReactNative, React } = vendetta.metro.common;

const s = storage;
s.mode ??= "manual";
s.running ??= false;
s.activity ??= {
  name: "Custom RPC",
  application_id: "1054951789318909972",
  type: 0,
  details: "",
  state: "",
  timestamps: { enabled: false, start: Date.now(), end: 0 },
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
    for (const [k,v] of Object.entries(o)) {
      if (k === "enabled") continue;
      const x = clean(v);
      if (x !== undefined) r[k] = x;
    }
    return Object.keys(r).length ? r : undefined;
  }
  return o;
}

function activity() {
  const a = JSON.parse(JSON.stringify(s.activity));

  if (a.timestamps?.enabled) {
    a.timestamps.start ||= Date.now();
    delete a.timestamps.enabled;
  } else {
    delete a.timestamps;
  }

  const bs = (a.buttons || []).filter(b =>
    b && b.label && /^https?:\/\//i.test(b.url || "")
  );

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
  } catch {}
}

function start() {
  if (unloaded) return;
  s.running = true;
  try {
    FluxDispatcher.dispatch({
      type: "LOCAL_ACTIVITY_UPDATE",
      activity: activity(),
      pid: 1608,
      socketId: "SkylightCustomRPC"
    });
  } catch (e) {
    s.running = false;
  }
}

function end() {
  s.running = false;
  clear();
}

function automatic(v) {
  s.mode = v ? "automatic" : "manual";
  if (v) start();
  else end();
}

function Button({title, onPress}) {
  return React.createElement(
    ReactNative.TouchableOpacity,
    { onPress, style: { padding: 14, marginVertical: 5, borderRadius: 10, backgroundColor: "#5865F2" } },
    React.createElement(ReactNative.Text, { style: { color: "#fff", fontWeight: "600", textAlign: "center" } }, title)
  );
}

function Label({text}) {
  return React.createElement(ReactNative.Text, { style: { color: "#fff", fontSize: 16, marginTop: 14, marginBottom: 6 } }, text);
}

function Input({title, value, onChange, keyboardType}) {
  return React.createElement(ReactNative.View, { style: { marginBottom: 10 } },
    React.createElement(Label, { text: title }),
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

  return React.createElement(ReactNative.ScrollView, { contentContainerStyle: { padding: 16, paddingBottom: 40 } },
    React.createElement(ReactNative.Text, { style: { color: "#fff", fontSize: 22, fontWeight: "700", marginBottom: 12 } }, "Skylight Custom RPC"),
    Button({ title: s.running ? "RPC Running" : "Start RPC", onPress: () => { start(); refresh(); } }),
    Button({ title: "End RPC", onPress: () => { end(); refresh(); } }),
    React.createElement(ReactNative.View, { style: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginVertical: 12 } },
      React.createElement(ReactNative.Text, { style: { color: "#fff", fontSize: 16 } }, "Automatic RPC"),
      React.createElement(ReactNative.Switch, {
        value: s.mode === "automatic",
        onValueChange: v => { s.mode = v ? "automatic" : "manual"; v ? start() : end(); refresh(); }
      })
    ),
    Input({title:"Name",value:s.activity.name,onChange:v=>{s.activity.name=v;refresh();}}),
    Input({title:"Application ID",value:s.activity.application_id,onChange:v=>{s.activity.application_id=v;refresh();},keyboardType:"numeric"}),
    Input({title:"Activity Type (0/1/2/3/5)",value:s.activity.type,onChange:v=>{s.activity.type=Number(v)||0;refresh();},keyboardType:"numeric"}),
    Input({title:"Details",value:s.activity.details,onChange:v=>{s.activity.details=v;refresh();}}),
    Input({title:"State",value:s.activity.state,onChange:v=>{s.activity.state=v;refresh();}}),
    Input({title:"Large Image",value:s.activity.assets.large_image,onChange:v=>{s.activity.assets.large_image=v;refresh();}}),
    Input({title:"Large Image Hover Text",value:s.activity.assets.large_text,onChange:v=>{s.activity.assets.large_text=v;refresh();}}),
    Input({title:"Small Image",value:s.activity.assets.small_image,onChange:v=>{s.activity.assets.small_image=v;refresh();}}),
    Input({title:"Small Image Hover Text",value:s.activity.assets.small_text,onChange:v=>{s.activity.assets.small_text=v;refresh();}}),
    React.createElement(ReactNative.View, { style: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginVertical: 12 } },
      React.createElement(ReactNative.Text, { style: { color: "#fff", fontSize: 16 } }, "Enable timestamp"),
      React.createElement(ReactNative.Switch, {
        value: !!s.activity.timestamps.enabled,
        onValueChange: v => { s.activity.timestamps.enabled = v; if (v) s.activity.timestamps.start = Date.now(); refresh(); }
      })
    ),
    Input({title:"Button 1 Label",value:s.activity.buttons[0].label,onChange:v=>{s.activity.buttons[0].label=v;refresh();}}),
    Input({title:"Button 1 URL",value:s.activity.buttons[0].url,onChange:v=>{s.activity.buttons[0].url=v;refresh();}}),
    Input({title:"Button 2 Label",value:s.activity.buttons[1].label,onChange:v=>{s.activity.buttons[1].label=v;refresh();}}),
    Input({title:"Button 2 URL",value:s.activity.buttons[1].url,onChange:v=>{s.activity.buttons[1].url=v;refresh();}}),
    React.createElement(ReactNative.Text, { style: { color: "#aaa", fontSize: 13, marginTop: 12 } }, "Changes are saved automatically. Press Start RPC after editing.")
  );
}

module.exports = {
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
