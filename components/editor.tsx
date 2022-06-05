import { default as MarkdownEditor } from "rich-markdown-editor";

import React, { useEffect, useRef, useState } from "react";

enum Status {
  Leader = "leader",
  Follower = "follower",
}

enum Type {
  First = "first",
  Normal = "normal",
}

type ClientMessage = {
  type?: Type;
  data?: string;
};

type ServerMessage = {
  status: Status;
  data?: string;
  type?: Type;
} | null;

const SECOND = 1_000;

const PROD_SERVER_URL = "wss://ws.kahvipatel.com/write";
const DEV_SERVER_URL = "ws://localhost:8000/write";

const SERVER_URL =
  process.env.NODE_ENV == "development" ? DEV_SERVER_URL : PROD_SERVER_URL;

const makeMessage = (data: string): ClientMessage => {
  return {
    data,
  };
};

function Editor() {
  const ws = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [editorState, setEditorState] = useState("");
  const [clientStatus, setClientStatus] = useState<Status>(Status.Follower);
  var timerId;

  const sendInitial = () => {
    if (!ws.current) return;

    const message: ClientMessage = {
      type: Type.First,
    };

    ws.current.send(JSON.stringify(message));
  };

  useEffect(() => {
    ws.current = new WebSocket(SERVER_URL);

    ws.current.onopen = function (evt) {
      setIsOpen(true);
      sendInitial();
      console.log("OPEN");
    };

    ws.current.onclose = function (evt) {
      setIsOpen(false);
      ws.current = null;
      console.log("CLOSE");
    };

    ws.current.onmessage = function (evt) {
      const message: ServerMessage = JSON.parse(evt.data);

      if (message["type"] === Type.First) {
        setEditorState(message["data"]);
      }

      setClientStatus(message["status"]);

      if (message["status"] == Status.Follower) {
        setEditorState(message["data"]);
        ws.current.send(JSON.stringify({ data: "" }));
      }
    };

    ws.current.onerror = function (evt) {
      setIsOpen(false);
      console.log("ERROR: " + evt.data);
    };

    const wsCurr = ws.current;

    return () => {
      wsCurr.close();
    };
  }, []);

  const onChange = (val) => {
    if (!ws.current) return;

    clearTimeout(timerId);

    const messageData: string = val();
    if (messageData.length > 536870888) {
      window.alert("uh oh, we're writing too much!");
    }

    timerId = setTimeout(() => {
      ws.current.send(JSON.stringify(makeMessage(messageData)));
    }, 2 * SECOND);
  };

  if (!isOpen) return <div>loading</div>;

  return (
    <main>
      <div style={clientStatus === Status.Follower ? { opacity: "0.5" } : {}}>
        <MarkdownEditor
          value={editorState}
          onChange={onChange}
          readOnly={clientStatus === Status.Follower}
        />
      </div>
    </main>
  );
}

export default Editor;
