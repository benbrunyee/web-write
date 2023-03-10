import { doc, getDoc, setDoc } from "firebase/firestore";
import { useEffect, useRef, useState } from "preact/hooks";
import { JSX } from "preact/jsx-runtime";
import { firestore } from "../../firebase";
import LineNumber from "../LineNumber";

export interface EditorProps {
  docId: "textDoc" | "publicTextDoc";
}

const Editor = ({ docId }: EditorProps): JSX.Element => {
  const [value, setValue] = useState("");
  const [saved, setSaved] = useState(true);
  const [debouncedValue, setDebouncedValue] = useState("");
  const isLoading = useRef(true);
  const lineElem = useRef<HTMLDivElement>(null);
  const [textAreaLineCount, setTextAreaLineCount] = useState(1);
  const textArea = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Count the number of "\n" in the text
    const count = (value.match(/\n/g) || []).length;
    setTextAreaLineCount(count + 1);

    if (value === debouncedValue) return;

    setSaved(false);

    const timeout = setTimeout(() => {
      setDebouncedValue(value);
    }, 500);

    return () => {
      clearTimeout(timeout);
    };
  }, [value]);

  useEffect(() => {
    const updateFirestore = async () => {
      try {
        await setDoc(doc(firestore, "text", docId), {
          value: debouncedValue,
        });
      } catch (e) {
        console.error(e);
      }

      setSaved(true);
    };

    if (!isLoading.current) {
      updateFirestore();
    }
  }, [debouncedValue]);

  useEffect(() => {
    const onLoad = async () => {
      try {
        const docRef = await getDoc(doc(firestore, "text", docId));

        if (docRef.exists()) {
          setValue(docRef.data()?.value ?? "");
        }
      } catch (e) {
        console.error(e);
      }

      isLoading.current = false;
    };

    onLoad();
  }, []);

  useEffect(() => {
    if (textArea.current) {
      textArea.current.focus();
    }
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flex: 1,
        flexDirection: "column",
      }}
    >
      <div
        style={{
          backgroundColor: "var(--background-light)",
          position: "sticky",
          top: 0,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            color: "var(--text-light)",
            fontSize: "0.8em",
            padding: "0.2em 0",
          }}
        >
          {saved ? "Saved" : "..."}
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "row", flex: 1 }}>
        <div
          style={{
            display: "flex",
            width: "fit-content",
            flexDirection: "column",
            backgroundColor: "var(--background-light)",
            marginRight: "0.5em",
            paddingTop: "0.5rem",
            boxSizing: "border-box",
            alignSelf: "stretch",
            minWidth: "2.5em",
          }}
        >
          <LineNumber ref={lineElem} number={1} />
          {Array.from({ length: textAreaLineCount - 1 }, (_, i) => i + 2).map(
            (i) => (
              <LineNumber key={i} number={i} />
            )
          )}
        </div>
        <textarea
          ref={textArea}
          className="textarea"
          value={value}
          onInput={(e) => {
            setValue(e.currentTarget.value ?? "");
          }}
          type="text"
          style={{
            lineHeight: "1.2em",
            fontSize: "1.2em",
            paddingTop: "0.5rem",
            boxSizing: "border-box",
            backgroundColor: "var(--background)",
            display: "flex",
            flex: 1,
            overflowY: "hidden",
            overflowX: "auto",
            resize: "none",
            color: "#fff",
            whiteSpace: "pre",
          }}
        />
      </div>
    </div>
  );
};

export default Editor;
