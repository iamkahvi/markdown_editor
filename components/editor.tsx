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
  const [messageState, setMessageState] = useState<ServerMessage>(null);
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

      console.log(message);

      setMessageState(message);

      if (message["type"] === "first") {
        setEditorState(message["data"]);
      }

      switch (message["status"]) {
        case Status.Leader:
          setClientStatus(Status.Leader);
          break;
        case Status.Follower:
          setClientStatus(Status.Follower);
          setEditorState(message["data"]);
          break;
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
  }, [setIsOpen]);

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
      {JSON.stringify(messageState)}
      <MarkdownEditor
        value={editorState}
        onChange={onChange}
        readOnly={clientStatus === Status.Follower}
      />
    </main>
  );
}

export default Editor;
