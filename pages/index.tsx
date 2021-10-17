import Head from "next/head";
import Editor from "rich-markdown-editor";
import React, { useEffect, useRef, useState } from "react";

// wsd --url ws://localhost:8080/echo

const EditableElement = (props: { onChange: (a: string) => void }) => {
  const { onChange } = props;
  const element = useRef(null);

  const onMouseUp = () => {
    const value = element.current?.value || element.current?.innerText;
    console.log(onChange);
    if (onChange) {
      onChange(value);
    }
  };

  useEffect(() => {
    const value = element.current?.value || element.current?.innerText;
    if (onChange) {
      onChange(value);
    }
  }, []);

  return <div contentEditable ref={element} onKeyUp={onMouseUp}></div>;
};

enum Status {
  First = "first",
  Normal = "normal",
}

type Message = {
  status: Status;
  data: string;
};

export default function Home() {
  const ws = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [initialVal, setInitialVal] = useState("");

  const fetchInitial = () => {
    if (!ws.current) return;

    const message: Message = {
      status: Status.First,
      data: "",
    };

    ws.current.send(JSON.stringify(message));
  };

  useEffect(() => {
    ws.current = new WebSocket("ws://localhost:8000/echo");

    ws.current.onopen = function (evt) {
      fetchInitial();
      setIsOpen(true);
      console.log("OPEN");
    };
    ws.current.onclose = function (evt) {
      console.log("CLOSE");
      setIsOpen(false);
      ws.current = null;
    };
    ws.current.onmessage = function (evt) {
      console.log("RESPONSE: " + evt.data);
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

  const onChange2 = () => {
    return (val) => {
      if (!ws.current) return;

      const message: Message = {
        status: Status.Normal,
        data: val(),
      };

      if (message.data.length > 536870888) {
        window.alert("oh no, we're writing too much!");
      }

      ws.current.send(JSON.stringify(message));
    };
  };

  const onChange = (ws: WebSocket) => {
    if (ws === undefined) {
      return;
    }

    return (a: string) => {
      if (a.length > 536870888) {
        window.alert("oh no, we're writing too much!");
      }
      console.log("send: " + a);

      ws.send(a);
    };
  };

  if (!isOpen) return "loading";

  return (
    <div className="container">
      <Head>
        <title>write here</title>
        <link rel="icon" href="/favicon.png" />
      </Head>

      <main>
        <h1 className="title">write here</h1>
        <Editor value={initialVal} onChange={onChange2()} />
        {/* <EditableElement onChange={onChange(ws)} /> */}
      </main>
    </div>
  );
}
