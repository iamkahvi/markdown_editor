import Head from "next/head";
import Editor from "rich-markdown-editor";
import React, { useEffect, useRef, useState } from "react";

// wsd --url ws://localhost:8080/echo

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

enum EditorState {
  TYPING = 1,
  WAITING = 2,
}

const SECOND = 1_000;

const makeMessage = (data: string): ClientMessage => {
  return {
    status: Status.Success,
    type: Type.Normal,
    data,
  };
};

export default function Home() {
  const ws = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [initialVal, setInitialVal] = useState("");
  const [editorState, setEditorState] = useState(EditorState.WAITING);
  const [message, setMessage] = useState(makeMessage(""));

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
    ws.current = new WebSocket("ws://localhost:8000/write");

    ws.current.onopen = function (evt) {
      setIsOpen(true);
      setEditorState(EditorState.WAITING);
      fetchInitial();
      console.log("OPEN");
    };

    ws.current.onclose = function (evt) {
      setIsOpen(false);
      setEditorState(EditorState.WAITING);
      ws.current = null;
      console.log("CLOSE");
    };

    ws.current.onmessage = function (evt) {
      const message = JSON.parse(evt.data);
      console.log("RECEIVED: " + message);
      if (message["type"] == "first") {
        const initialText = message["data"];
        console.log("setting state?: " + initialText);
        setInitialVal(initialText);
      }
    };

    ws.current.onerror = function (evt) {
      setIsOpen(false);
      setEditorState(EditorState.WAITING);
      console.log("ERROR: " + evt.data);
    };

    const wsCurr = ws.current;

    return () => {
      wsCurr.close();
    };
  }, [setIsOpen, setEditorState]);

  useEffect(() => {
    console.log("editor state use effect" + editorState.toString());

    // How to make sure the editorState is WAITING
    // for a certain amount of time?

    // At the moment I'm just checking the beginning and end
    if (editorState == EditorState.WAITING) {
      setTimeout(() => {
        if (editorState == EditorState.WAITING && isOpen) {
          console.log("sending through the socket");
          ws.current.send(JSON.stringify(message));
        }
      }, 2 * SECOND);
    }
    return;
  }, [editorState]);

  const onChange = (val) => {
    console.log("onChange");

    if (!ws.current) return;

    setEditorState(EditorState.TYPING);

    const messageData = val();

    if (messageData > 536870888) {
      window.alert("oh no, we're writing too much!");
    }

    setMessage(makeMessage(messageData));
    setEditorState(EditorState.WAITING);
  };

  if (!isOpen) return "loading";

  return (
    <div className="container">
      <Head>
        <title>write here</title>
        <link rel="icon" href="/favicon.png" />
      </Head>

      <main>
        <Editor value={initialVal} onChange={onChange} />
      </main>
    </div>
  );
}
