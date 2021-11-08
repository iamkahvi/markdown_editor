import { default as MarkdownEditor } from "rich-markdown-editor";

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

const SERVER_URL = "wss://ws.kahvipatel.com/write";

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
      console.log("CLOSE");
    };

    ws.current.onmessage = function (evt) {
      const message = JSON.parse(evt.data);

      if (message["type"] == "first") {
        setInitialVal(message["data"]);
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
      <MarkdownEditor value={initialVal} onChange={onChange} />
    </main>
  );
}

export default Editor;
