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

export default function Home() {
  const ws = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [initialVal, setInitialVal] = useState("");

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
      const r = JSON.parse(evt.data);
      // console.log(r);
      setInitialVal(r["data"]);
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

  const onChange = () => {
    return (val) => {
      if (!ws.current) return;

      const message: ClientMessage = {
        status: Status.Success,
        type: Type.Normal,
        data: val(),
      };

      if (message.data.length > 536870888) {
        window.alert("oh no, we're writing too much!");
      }

      ws.current.send(JSON.stringify(message));
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
        <Editor value={initialVal} onChange={onChange()} />
      </main>
    </div>
  );
}
