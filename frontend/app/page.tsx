"use client";
import Link from "next/link";
import { SyntheticEvent, useEffect, useRef, useState } from "react";
import { WebContainer } from "@webcontainer/api";
import Editor from "@monaco-editor/react";
import { Terminal } from "xterm";
import "xterm/css/xterm.css";
// Call only once
export default function Home() {
  const [isDropDownActive, setIsDropDownActive] = useState(false);
  const dropdownRef = useRef<HTMLSelectElement>(null);
  const previewRef = useRef<HTMLIFrameElement>(null);
  const handleClickOutside = (event: any) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsDropDownActive(false);
    }
  };
  const [loadingWebContainer, setLoadingWebContainer] = useState(true);
  const [loadingWebContainerMessage, setLoadingWebContainerMessage] =
    useState("");
  const timeoutId = useRef<NodeJS.Timeout | null>(null);
  const webcontainerInstanceRef = useRef<WebContainer>();
  const editorRef = useRef<any>(null);
  // const terminalRef = useRef<HTMLDivElement>(null);
  // const [isTerminal, setIsTerminal] = useState(false);
  // const toggleTerminal = () => {
  //   setIsTerminal(!isTerminal);
  // };
  function showValue() {
    if (editorRef.current) {
      return editorRef.current!.getValue();
    } else {
      return "";
    }
  }
  function showMe() {
    if (editorRef.current) {
      editorRef.current!.setValue(
        `import React from 'react';\n\nfunction App() {\n  return (\n    <div>\n\t\t\tHello React\n\t\t</div>\n  );\n}\n\nexport default App;`
      );
    }
  }
  const monacoEditor = (editor: any, monaco: any) => {
    Promise.all([
      fetch("https://unpkg.com/@types/react/index.d.ts").then((res) =>
        res.text()
      ),
      fetch("https://unpkg.com/@types/react-dom/index.d.ts").then((res) =>
        res.text()
      ),
    ]).then(([react, reactDom]) => {
      // Add typings
      monaco.languages.typescript.javascriptDefaults.addExtraLib(
        react,
        "react/index.d.ts"
      );
      monaco.languages.typescript.javascriptDefaults.addExtraLib(
        reactDom,
        "react-dom/index.d.ts"
      );

      // Configure JavaScript defaults
      monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.ESNext,
        allowNonTsExtensions: true,
        moduleResolution:
          monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        module: monaco.languages.typescript.ModuleKind.CommonJS,
        jsx: monaco.languages.typescript.JsxEmit.React,
        jsxFactory: "React.createElement",
        jsxFragmentFactory: "React.Fragment",
        allowJs: true,
        typeRoots: ["node_modules/@types"],
        noEmit: true,
        strict: true,
        noImplicitAny: true,
        strictNullChecks: true,
      });
    });
    monaco.editor.defineTheme("myTheme", {
      base: "vs-dark",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#16181D",
      },
    });
    monaco.editor.setTheme("myTheme");
    editorRef.current = editor;
  };
  const updateWebContainer = async (value: string) => {
    const filePath = "my-app/src/App.jsx";

    try {
      // Send the JSX content as a separate payload
      await webcontainerInstanceRef.current!.fs.writeFile(filePath, value);
      // Optionally, you can log a success message
      // console.log(`Successfully updated ${filePath}`);
    } catch (error: any) {
      // Handle errors
      throw new Error(`Unable to update ${filePath}: ${error.message}`);
    }
  };

  function handleEditorChange(value: string | undefined, event: any) {
    if (loadingWebContainer) {
      return;
    }

    // If there's an existing timeout, clear it
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
    }

    // Set a new timeout
    timeoutId.current = setTimeout(() => {
      updateWebContainer(value as string);
    }, 250);
  }
  useEffect(() => {
    async function inititalizeWebContainer() {
      // const terminal = new Terminal({
      //   convertEol: true,
      // });
      // if (terminalRef.current) {
      //   terminal.open(terminalRef.current as HTMLElement);
      // }
      const webcontainerInstance = await WebContainer.boot();
      webcontainerInstanceRef.current = webcontainerInstance;
      webcontainerInstance.on("server-ready", async (port, url) => {
        if (previewRef.current) {
          previewRef.current.src = url;
        }
        setLoadingWebContainer(false);

        // const iframe = previewRef.current;

        // const handleMessage = (event: any) => {
        //   console.log("This is called");
        //   console.log(event);
        //   console.log(event.source);
        //   console.log(event.data);
        //   // Check if the message is from the iframe
        //   if (event.source[0] === iframe!.contentWindow) {
        //     // Handle the error message from the iframe
        //     const errorMessage = event.data;
        //     console.error("Error in iframe:", errorMessage);
        //   }
        // };

        // // Add an event listener for the 'message' event
        // window.addEventListener("message", handleMessage);

        // // Cleanup the event listener when the component is unmounted
        // return () => {
        //   window.removeEventListener("message", handleMessage);
        // };
      });
      const startDevServer = async () => {
        const initProcess = await webcontainerInstance.spawn("npx", [
          "-y",
          "create-vite",
          "my-app",
          "--template",
          "react",
        ]);
        initProcess.output.pipeTo(
          new WritableStream({
            write: (chunk) => {
              // console.log(chunk);
            },
          })
        );
        const initExitCode = await initProcess.exit;
        if (initExitCode !== 0) {
          throw new Error("Unable to run npm init");
        }
        const installProcess = await webcontainerInstance.spawn("sh", [
          "-c",
          "cd my-app && npm install",
        ]);
        setLoadingWebContainerMessage("Initializing Webcontainer...");
        installProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              // terminal.write(data);
            },
          })
        );
        const installExitCode = await installProcess.exit;
        if (installExitCode !== 0) {
          throw new Error("Unable to run npm install");
        }
        setLoadingWebContainerMessage("Installing Dependencies");
        // Overwrite App.jsx with an empty component
        const overwriteAppJsx = await webcontainerInstance.spawn("sh", [
          "-c",
          `echo \"${showValue()}\" > my-app/src/App.jsx`,
        ]);
        overwriteAppJsx.output.pipeTo(
          new WritableStream({
            write(data) {
              // terminal.write(data);
            },
          })
        );
        if ((await overwriteAppJsx.exit) !== 0) {
          throw new Error("Unable to overwrite App.jsx");
        }

        // Overwrite App.css with an empty file
        const overwriteAppCss = await webcontainerInstance.spawn("sh", [
          "-c",
          'echo "" > my-app/src/App.css',
        ]);
        overwriteAppCss.output.pipeTo(
          new WritableStream({
            write(data) {
              // terminal.write(data);
            },
          })
        );
        setLoadingWebContainerMessage("Setting up Project");
        if ((await overwriteAppCss.exit) !== 0) {
          throw new Error("Unable to overwrite App.css");
        }
        // Overwrite main.css with an empty file
        const overwriteMainCss = await webcontainerInstance.spawn("sh", [
          "-c",
          'echo "" > my-app/src/index.css',
        ]);
        overwriteMainCss.output.pipeTo(
          new WritableStream({
            write(data) {
              // terminal.write(data);
            },
          })
        );
        if ((await overwriteMainCss.exit) !== 0) {
          throw new Error("Unable to overwrite main.css");
        }
        setLoadingWebContainerMessage("Starting Dev Server");
        const runVite = await webcontainerInstance.spawn("sh", [
          "-c",
          "cd my-app && npm run dev",
        ]);
        runVite.output.pipeTo(
          new WritableStream({
            write(data) {
              // terminal.write(data);
            },
          })
        );
        if ((await runVite.exit) !== 0) {
          throw new Error("Unable to run npm run dev");
        }
        setLoadingWebContainerMessage("Starting");
      };
      startDevServer();
    }
    inititalizeWebContainer();
  }, []);

  useEffect(() => {
    if (isDropDownActive) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropDownActive]);
  const handleError = (event: any) => {
    console.error("Error loading iframe:", event.message);
    // Handle the error here, like displaying an error message to the user
  };
  return (
    <main className="bg-[#1B1D24] h-[calc(100svh-64px)] text-white ">
      <div className="container mx-auto flex flex-col md:flex-row h-full">
        <section className="bg-[#282D37] flex-1 basis-0 p-4 flex flex-col">
          <select
            ref={dropdownRef}
            onClick={() => {
              setIsDropDownActive(!isDropDownActive);
            }}
            name="
          "
            id=""
            className={
              isDropDownActive
                ? "px-4 py-5 w-full rounded-md font-bold bg-[#283541] text-[#139FCD] text-2xl"
                : "px-4 py-5 w-full rounded-md font-bold bg-[#282D37] text-2xl"
            }
          >
            <option value="">Getting Started</option>
          </select>
          <div className="p-4 flex-col gap-4 flex flex-1 overflow-scroll">
            <p>Welcome to the React tutorial!</p>

            <p>
              The goal of this tutorial is to quickly give you an experience of
              what it feels like to work with React, right in the browser. It
              does not aim to be comprehensive, and you don't need to understand
              everything before moving on. However, after you complete it, make
              sure to also read the Guide which covers each topic in more
              detail.
            </p>

            <h2 className="font-bold">Prerequisites</h2>

            <p>
              The tutorial assumes basic familiarity with HTML, CSS and
              JavaScript. If you are totally new to front-end development, it
              might not be the best idea to jump right into a framework as your
              first step - grasp the basics then come back! Prior experience
              with other frameworks helps, but is not required.
            </p>

            <h2 className="font-bold">How to Use This Tutorial</h2>

            <p>
              You can edit the code on the right and see the result update
              instantly. Each step will introduce a core feature of React, and
              you will be expected to complete the code to get the demo working.
              If you get stuck, you will have a "Show me!" button that reveals
              the working code for you. Try not to rely on it too much - you'll
              learn faster by figuring things out on your own.
            </p>

            <p>
              If you are an experienced developer coming from React's previous
              versions or other frameworks, there are a few settings you can
              tweak to make the best use of this tutorial. If you are a
              beginner, it's recommended to go with the defaults.
            </p>
            <button
              onClick={showMe as any}
              className="my-2 border-2 border-sky-600 rounded-md py-2 bg-sky-600 font-bold hover:bg-sky-700 transition-all ease-in-out duration-75 w-full text-white active:bg-white active:text-sky-600 active:border-sky-600 active:shadow-md hover:shadow-md hover:text-white hover:border-sky-700"
            >
              Show Me!
            </button>
          </div>
          <div className="border-t-2 py-3  border-gray-50 flex justify-between">
            <div></div>
            <Link href="" className="text-[#139FCD]">
              Next <span className="text-gray-400">&gt;</span>
            </Link>
          </div>
        </section>
        <section className="flex-1 basis-36 bg-[#232730] p-4 flex min-h-[860px]">
          <div className="border-[1px] border-gray-500 rounded-md overflow-hidden shadow-md flex-1 flex flex-col">
            <div className="flex-1 flex flex-col basis-0">
              <div className="bg-[#343A46] text-[#139FCD] pt-3 px-3 flex ">
                <p className="border-b-[1px] border-[#139FCD] font-medium pb-3">
                  App.js
                </p>
              </div>
              <div className="bg-[#16181D] flex-1 basis-0">
                <Editor
                  // className="flex-1 shrink-1 basis-0 h-full"
                  // height={"100%"}
                  defaultLanguage="javascript"
                  defaultValue={`import React from 'react';\n\nfunction App() {\n  return (\n    <div>\n\t\t\tHello World\n\t\t</div>\n  );\n}\n\nexport default App;`}
                  theme="vs-dark"
                  onMount={monacoEditor}
                  onChange={handleEditorChange}
                  loading={<p>Monaco Editor Loading...</p>}
                />
              </div>
            </div>
            <div className="flex-1 flex flex-col bg-[#23272F] basis-0">
              <div className="bg-[#343A46] text-[#139FCD] pt-3 px-3 flex justify-between items-center">
                <p className="font-medium pb-3">Preview</p>
                {/* <button onClick={toggleTerminal}>
                  <span className="material-symbols-outlined">terminal</span>
                </button> */}
              </div>
              <div
                className={
                  loadingWebContainer /*&& !isTerminal*/
                    ? "flex-1 flex justify-center items-center flex-col gap-4"
                    : "hidden"
                }
              >
                <svg
                  width="100%"
                  height="100%"
                  viewBox="-10.5 -9.45 21 18.9"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-sm me-0 w-10 h-10 text-link dark:text-link-dark flex origin-center transition-all ease-in-out animate-spin"
                >
                  <circle cx="0" cy="0" r="2" fill="#139FCD"></circle>
                  <g stroke="#139FCD" strokeWidth="1" fill="none">
                    <ellipse rx="10" ry="4.5"></ellipse>
                    <ellipse rx="10" ry="4.5" transform="rotate(60)"></ellipse>
                    <ellipse rx="10" ry="4.5" transform="rotate(120)"></ellipse>
                  </g>
                </svg>
                <p className="font-medium">
                  {loadingWebContainerMessage.length == 0
                    ? "Loading Webcontainer"
                    : loadingWebContainerMessage}
                </p>
              </div>
              <div
                className={
                  !loadingWebContainer /*&& !isTerminal*/
                    ? "bg-white text-black rounded-md m-3 flex-1"
                    : "hidden"
                }
              >
                <iframe
                  ref={previewRef}
                  onError={handleError}
                  className="h-full w-full"
                ></iframe>
              </div>
              {/* <div
                className={
                  isTerminal
                    ? "bg-black flex-1 text-white p-4"
                    : "bg-black flex-1 hidden"
                }
                ref={terminalRef}
              ></div> */}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
