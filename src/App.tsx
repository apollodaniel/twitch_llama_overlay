import Markdown from "markdown-to-jsx";
import Prism from "prismjs";
import "prismjs/themes/prism-monokai-charcoal.css";
import { useState, useRef, useEffect } from "react";
import { EMITTER, listenBotMessages } from "./functions";
import * as tts from "@mintplex-labs/piper-tts-web";

function App() {
	const [response, setResponse] = useState(
		`Nada **ainda**, **pergunte algo** com \`!ask\``,
	);

	const [history, setHistory] = useState("");
	const newResponse = useRef(true);

	const firstTime = useRef(true);

	useEffect(() => {
		if (firstTime) {
			firstTime.current = false;
			Prism.highlightAll();
			listenBotMessages(
				async (content: string, type: string, done) => {
					if (type === "chat") {
						if (!done && newResponse.current === true) {
							setResponse(content);
							newResponse.current = false;
						} else {
							setResponse((prev) => prev + content);
						}
						if (done) {
							newResponse.current = true;
							await new Promise((r) => setTimeout(r, 2000));
						}
					}
				},
				(command: string, username: string) => {
					setHistory(
						(prev) =>
							`${prev}<br> - ${Intl.DateTimeFormat("pt-BR", { timeStyle: "medium" }).format(Date.now())} ${username}: ${command}`,
					);
				},
			);
		}
	}, []);
	return (
		<main>
			<div className="result-parent" id="bot-response">
				<div className="result-container">
					<Markdown>{response}</Markdown>
				</div>
			</div>
			<div className="result-parent" id="others">
				<div className="result-container">
					<Markdown>{history}</Markdown>
				</div>
			</div>
		</main>
	);
}

export default App;
