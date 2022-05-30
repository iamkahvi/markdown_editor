import { default as MarkdownEditor } from "rich-markdown-editor";
import { Editor as DraftJSEditor, EditorState, ContentState } from "draft-js";

import React, { useEffect, useRef, useState } from "react";

enum Status {
  Success = "success",
  Error = "error",
}

enum Type {
  First = "first",
  Normal = "normal",
}

type ClientMessage = {
  status: Status;
  type: Type;
  data: string;
};

const SECOND = 1_000;

const PROD_SERVER_URL = "wss://ws.kahvipatel.com/write";
const DEV_SERVER_URL = "ws://localhost:8000/write";

const SERVER_URL =
  process.env.NODE_ENV == "development" ? DEV_SERVER_URL : PROD_SERVER_URL;

const makeMessage = (data: string): ClientMessage => {
  return {
    status: Status.Success,
    type: Type.Normal,
    data,
  };
};

function Editor() {
  const ws = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [initialVal, setInitialVal] = useState("");

  const [editorState, setEditorState] = useState(() =>
    EditorState.createEmpty()
  );
  var timerId;

  const fetchInitial = () => {
    if (!ws.current) return;

    const message: ClientMessage = {
      status: Status.Success,
      type: Type.First,
      data: "",
    };

    ws.current.send(JSON.stringify(message));
  };

  useEffect(() => {
    ws.current = new WebSocket(SERVER_URL);

    ws.current.onopen = function (evt) {
      setIsOpen(true);
      fetchInitial();
      console.log("OPEN");
    };

    ws.current.onclose = function (evt) {
      setIsOpen(false);
      ws.current = null;
      console.log("CLOSE: " + evt.code + " " + evt.reason);
    };

    ws.current.onmessage = function (evt) {
      const message = JSON.parse(evt.data);

      if (message["type"] == "first") {
        const newState = EditorState.createWithContent(
          ContentState.createFromText(message["data"])
        );
        setEditorState(newState);
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
    setEditorState(val);
    if (!ws.current) return;

    clearTimeout(timerId);

    const messageData: string = val.getCurrentContent().getPlainText();

    if (messageData.length > 536870888) {
      window.alert("uh oh, we're writing too much!");
    }

    timerId = setTimeout(() => {
      console.log(messageData);
      ws.current.send(JSON.stringify(makeMessage(messageData)));
    }, 2 * SECOND);
  };

  if (!isOpen) return <div>loading</div>;

  return (
    <main>
      <DraftJSEditor editorState={editorState} onChange={onChange} />
    </main>
  );
}

export default Editor;
