"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./ready.module.css";

type Computer = "windows" | "mac" | "linux" | "unsure";
const choices: { id: Computer; label: string }[] = [
  { id: "windows", label: "Windows PC or laptop" },
  { id: "mac", label: "Mac" },
  { id: "linux", label: "Linux computer" },
  { id: "unsure", label: "I’m not sure" },
];
const guidance: Record<Exclude<Computer, "unsure">, string> = {
  windows: "Open the Start menu and search for “About your PC” to find the Windows version, processor, and installed memory (RAM). Search for “Storage settings” to see the drive’s total and free space. Labels can vary on older Windows versions.",
  mac: "Open the Apple menu in the top-left corner and choose “About This Mac.” Note the macOS version, chip or processor, and memory. Look for Storage there or in System Settings; its location depends on your macOS version.",
  linux: "Open Settings and look for “About” or “System Information” to find the Linux version, processor, and memory. Look for storage information in the file manager or disk utility. Names vary between Linux systems; you do not need to enter terminal commands.",
};

export default function ComputerCheck() {
  const [computer, setComputer] = useState<Computer | null>(null);
  const [next, setNext] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const buttons = useRef<Partial<Record<Computer, HTMLButtonElement | null>>>({});
  const returnFocus = useRef<Computer | null>(null);

  useEffect(() => {
    if (computer) heading.current?.focus();
    else if (returnFocus.current) buttons.current[returnFocus.current]?.focus();
  }, [computer, next]);

  function goBack() {
    returnFocus.current = computer;
    setComputer(null);
    setNext(false);
  }

  return (
    <section id="computer-check" className={styles.section} aria-labelledby="check-heading">
      <div className={styles.sectionIntro}>
        <span className="kicker">Start with the computer you already have</span>
        <h2 id="check-heading">Step 1: Is your computer ready?</h2>
        <p>We will answer one question at a time. You do not need to know the model name or understand technical terms before you begin.</p>
      </div>
      <div className={styles.checkPanel}>
        {!computer ? (
          <>
            <h3 id="computer-question">What kind of computer are you starting with?</h3>
            <div className={styles.choices} role="group" aria-labelledby="computer-question">
              {choices.map(({ id, label }) => (
                <button key={id} ref={el => { buttons.current[id] = el; }} type="button" className={styles.choice} onClick={() => setComputer(id)}>
                  {label}<span aria-hidden="true">→</span>
                </button>
              ))}
            </div>
            <p className={styles.small}>Choose one to see where to look. This page does not scan or change your computer, and your choice is not saved or sent.</p>
            <noscript><p>Turn on JavaScript to use these choices. You can still read the process and planned kit below. Before changing your computer, make a backup and check that you can open the saved files.</p></noscript>
          </>
        ) : (
          <>
            <span className="kicker">{choices.find(choice => choice.id === computer)?.label}</span>
            <h3 ref={heading} tabIndex={-1} className={styles.checkHeading}>
              {computer === "unsure" ? "Let’s find out together." : next ? "Next: protect your files." : "First, find your computer’s details."}
            </h3>
            {computer === "unsure" ? (
              <>
                <p>We’ll show you where to find that information. Turn on the computer and look at the screen:</p>
                <ul className={styles.checkList}>
                  <li>An Apple menu in the top-left corner usually means you are using a Mac.</li>
                  <li>A Start menu with a Windows symbol usually means you are using Windows.</li>
                  <li>A name such as Ubuntu, Mint, or Fedora may mean you are using Linux.</li>
                </ul>
                <p>The software on the screen is a better clue than the logo on the case. If it will not start or you still cannot tell, leave the files alone and ask someone you trust to help identify it before making changes.</p>
                <button type="button" className="btn btn-gold" onClick={goBack}>Show computer choices</button>
              </>
            ) : next ? (
              <>
                <p>Before wiping, reinstalling, or changing anything, copy important files to a separate drive or a backup service. Open a few files from that backup to check that the copies work. Keep account recovery details somewhere safe too.</p>
                <div className={styles.note}>
                  <strong>Your computer is not confirmed ready yet.</strong>
                  <p>This first step helps you gather information. The full guided readiness check is still being prepared. Memory, free space, operating-system support, and each tool’s requirements still need to be checked before choosing a setup.</p>
                </div>
                <p>If you cannot access your files or are not sure they are backed up, stop before erasing anything and get help. Back up first, then decide whether to keep, clean up, or rebuild the old setup.</p>
                <a className="btn btn-gold" href="#included">See what the kit will help with →</a>
                <button type="button" className={styles.backButton} onClick={() => setNext(false)}>Back to finding my details</button>
              </>
            ) : (
              <>
                <p>{guidance[computer]}</p>
                <p>Write down what you find: the system version, processor, memory, and total and free storage. Memory helps the computer do work; storage is the space for your files and tools. Keep these notes for the next check—you do not need to enter them here.</p>
                <p className={styles.small}>Only look for now. Do not erase or reinstall anything. Finding these details does not confirm that every tool will run.</p>
                <button type="button" className="btn btn-gold" onClick={() => setNext(true)}>I have my details — what’s next?</button>
                <p className={styles.small}>Can’t find something? It is fine to pause and ask someone to help you look. Do not guess.</p>
              </>
            )}
            {computer !== "unsure" && <button type="button" className={styles.backButton} onClick={goBack}>Change computer type</button>}
          </>
        )}
      </div>
    </section>
  );
}
