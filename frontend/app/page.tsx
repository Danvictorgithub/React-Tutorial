"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function Home() {
  const [isDropDownActive, setIsDropDownActive] = useState(false);
  const dropdownRef = useRef<HTMLSelectElement>(null);

  const handleClickOutside = (event: any) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsDropDownActive(false);
    }
  };

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
  return (
    <main className="bg-[#1B1D24] h-[calc(100svh-64px)] text-white ">
      <div className="container mx-auto flex h-full">
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
            <button className="my-2 border-2 border-sky-600 rounded-md py-2 bg-sky-600 font-bold">
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
        <section className="flex-1 basis-36 bg-[#232730] p-4 flex">
          <div className="border-[1px] border-gray-500 rounded-md overflow-hidden shadow-md flex-1 flex flex-col">
            <div className="flex-1 flex flex-col">
              <div className="bg-[#343A46] text-[#139FCD] pt-3 px-3 flex ">
                <p className="border-b-[1px] border-[#139FCD] font-medium pb-3">
                  App.js
                </p>
              </div>
              <div className="p-4 bg-[#16181D] flex-1">
                Initializing Monaco Editor...
              </div>
            </div>
            <div className="flex-1 flex flex-col bg-[#23272F]">
              <div className="bg-[#343A46] text-[#139FCD] pt-3 px-3 flex">
                <p className="font-medium pb-3">Preview</p>
              </div>
              <div className="bg-white text-black rounded-md p-3 m-3 flex-1">
                Loading Web Containers...
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
