import Head from "next/head";
import dynamic from "next/dynamic";

import React from "react";

const EditorNoSSR = dynamic(() => import("../components/editor"), {
  ssr: false,
});

export default function Home() {
  return (
    <div className="container">
      <Head>
        <title>write here</title>
        <link rel="icon" href="/favicon.png" />
      </Head>
      <EditorNoSSR />
    </div>
  );
}
