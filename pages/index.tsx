import Head from "next/head";
import Editor from "rich-markdown-editor";
import React, { useEffect, useRef } from "react";

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

export default function Home() {
  var ws;

  useEffect(() => {
    ws = new WebSocket("ws://localhost:8080/echo");

    ws.onopen = function (evt) {
      console.log("OPEN");
    };
    ws.onclose = function (evt) {
      console.log("CLOSE");
      ws = null;
    };
    ws.onmessage = function (evt) {
      console.log("RESPONSE: " + evt.data);
    };
    ws.onerror = function (evt) {
      console.log("ERROR: " + evt.data);
    };

    return () => {};
  }, []);

  const onChange2 = () => {
    return (val) => {
      console.log("hello" + ws);
      const message = val();

      if (message.length > 536870888) {
        window.alert("oh no, we're writing too much!");
      }
      console.log(message);

      ws.send(message);
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

  // if (ws === undefined) {
  //   return <div>loading</div>;
  // } else {
  return (
    <div className="container">
      <Head>
        <title>write here</title>
        <link rel="icon" href="/favicon.png" />
      </Head>

      <main>
        <h1 className="title">write here</h1>
        <Editor value="" onChange={onChange2()} />
        {/* <EditableElement onChange={onChange(ws)} /> */}
      </main>
    </div>
  );
  // }
}
