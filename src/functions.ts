import events from "events";
import { useRef } from "react";
import tmi from "tmi.js";

export const EMITTER = new events.EventEmitter();

function prepareString(input: string): string {
	return Array.from(input)
		.map((char) => {
			const code = char.charCodeAt(0);
			return `\\u${code.toString(16).padStart(4, "0")}`; // Convert to Unicode escape
		})
		.join("");
}
export function listenBotMessages(
	callback: (
		content: string,
		type: "chat" | "command" | "tts",
		done?: boolean,
	) => void,
	onReceived: (command: string, username: string) => void,
) {
	// example channel
	// some exameple commands
	const client = tmi.Client({
		options: { debug: true },
		channels: ["devapollo_"],
	});
	client.connect().catch(console.error);
	let processing = false;
	client.on("message", async (channel, userstate, message) => {
		if (processing) return;
		processing = true;
		const args = message.split(" ").filter((arg, index) => index > 0);
		if (message.startsWith("!ask") && args.length > 0) {
			onReceived("!ask", userstate.username || "desconhecido");
			await ask_llama(
				args.join(" ").trim(),
				(content: string, done: boolean) => {
					if (done) {
						setTimeout(() => (processing = false), 2000);
					}
					callback(content, "chat", done);
				},
			);
		} else if (message.startsWith("!ideia")) {
			onReceived("!ideia", userstate.username || "desconhecido");
			await ask_llama(
				`Gere uma ideia de projeto de programação, para um streamer programador, o  projeto deve ser divertido e criativo. ${args.length > 0 ? "Use o seguinte tema: " + args.join(" ").trim() : ""}`,
				(content: string, done: boolean) => {
					if (done) {
						setTimeout(() => (processing = false), 2000);
					}
					callback(content, "chat", done);
				},
			);
		} else if (message.startsWith("!analisarvaga")) {
			if (args.length < 0) return;
			onReceived("!analisarvaga", userstate.username || "desconhecido");
			await ask_llama(
				`Com base nos requisitos desta vaga para [cargo], gostaria que criasse um desafio para mim, que não seja uma livraria online, ou gerenciador de livros. ${args.length > 0 ? "Use o seguinte tema: " + args.join(" ").trim() : ""}`,
				(content: string, done: boolean) => {
					if (done) {
						setTimeout(() => (processing = false), 2000);
					}
					callback(content, "!analisarvaga", done);
				},
			);
		}
	});
}

async function ask_llama(
	prompt: string,
	callback: (content: string, done: boolean) => void,
) {
	// ollama api url
	const response = await fetch("http://localhost:11434/api/generate", {
		method: "POST",
		body: `{ "model": "llama3.1", "prompt": "${prepareString(prompt)}", "stream": true }`,
	});
	if (!response.body) return;
	const stream_reader = response.body.getReader();
	const decoder = new TextDecoder();

	while (true) {
		const { done, value } = await stream_reader.read();
		if (done) break;
		const content = JSON.parse(decoder.decode(value));
		callback(content["response"], false);
	}
	callback("", true);
}
