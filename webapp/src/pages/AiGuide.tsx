// @ts-nocheck
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  API_URL,
  useSendAiChatTextMutation,
  useSendAiVoiceFileMutation,
} from "../api";
import { useTelegram } from "../hooks/useTelegram";
import MicIcon from '../assets/icons/mic.svg'
import SendIcon from '../assets/icons/send.svg'
import SquareIcon from '../assets/icons/square.svg'
import Volume2Icon from '../assets/icons/volume-2.svg'
import SparklesIcon from '../assets/icons/sparkles.svg'
import ArrowLeftIcon from '../assets/icons/arrow-left.svg'
import robotAvatar from "../assets/ai_guide_avatar.jpg";

export default function AiGuide() {
  const navigate = useNavigate();
  const { haptic, showAlert } = useTelegram();
  const sendTextMutation = useSendAiChatTextMutation();
  const sendVoiceMutation = useSendAiVoiceFileMutation();

  const [messages, setMessages] = useState<any[]>([]);
  const [textInput, setTextInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlayingId, setIsPlayingId] = useState<any>(null);

  const chatViewportRef = useRef(null);
  const chatEndRef = useRef(null);
  const audioRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    // Lock body scrolling and reset scroll to top on mount
    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.scrollTo(0, 0);

    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  useEffect(() => {
    // Scroll chat viewport container to bottom on new messages
    if (chatViewportRef.current) {
      chatViewportRef.current.scrollTop = chatViewportRef.current.scrollHeight;
    }
  }, [messages, isProcessing]);

  // Audio Playback Handler
  const playAudio = (url, msgId) => {
    haptic.impact("light");
    if (isPlayingId === msgId) {
      audioRef.current.pause();
      setIsPlayingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const fullUrl = url.startsWith("/")
        ? `${api.API_BASE.replace("/api", "")}${url}`
        : url;
      audioRef.current = new Audio(fullUrl);
      audioRef.current.play().catch((err) => {
        console.warn("Autoplay blocked or audio playback failed:", err);
      });
      setIsPlayingId(msgId);
      audioRef.current.onended = () => {
        setIsPlayingId(null);
      };
    }
  };

  // Convert messages for API format
  const getApiHistory = () => {
    return messages.map((m) => ({
      role: m.sender === "user" ? "user" : "assistant",
      content: m.text,
    }));
  };

  // SendIcon Text prompt
  const handleSendText = async () => {
    if (!textInput.trim()) return;
    const prompt = textInput.trim();
    setTextInput("");
    haptic.impact("medium");

    const newMsg = { id: Date.now(), sender: "user", text: prompt };
    setMessages((prev) => [...prev, newMsg]);
    setIsProcessing(true);

    try {
      const res = await sendTextMutation.mutateAsync({ prompt });
      if (res.ok) {
        haptic.success();
        const replyMsg = {
          id: Date.now() + 1,
          sender: "ai",
          text: res.text,
          audioUrl: res.audio_url,
        };
        setMessages((prev) => [...prev, replyMsg]);
      } else {
        showAlert("Ошибка ответа ИИ");
      }
    } catch (err) {
      console.error(err);
      fetch(`${API_URL}/log-error`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: err.message || String(err),
          stack: err.stack || "",
          url: window.location.href,
        }),
      }).catch(() => {});
      showAlert("Ошибка связи с ИИ");
    } finally {
      setIsProcessing(false);
    }
  };

  // Microphone Recording Start
  const startRecording = async () => {
    haptic.impact("heavy");
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Use standard ogg format if possible, fallback to webm
      let options = { mimeType: "audio/webm" };
      if (MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")) {
        options = { mimeType: "audio/ogg;codecs=opus" };
      }

      mediaRecorderRef.current = new MediaRecorder(stream, options);
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: options.mimeType,
        });
        await handleSendVoice(audioBlob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error(err);
      showAlert("Доступ к микрофону отклонен");
    }
  };

  // Microphone Recording Stop
  const stopRecording = () => {
    haptic.impact("medium");
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      // Stop all tracks to release mic
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
      setIsRecording(false);
    }
  };

  // Upload Voice Recording to backend
  const handleSendVoice = async (audioBlob) => {
    setIsProcessing(true);
    try {
      const res = await sendVoiceMutation.mutateAsync({ blob: audioBlob });
      if (res.ok) {
        haptic.success();
        const userMsg = { id: Date.now(), sender: "user", text: res.user_text };
        const aiMsg = {
          id: Date.now() + 1,
          sender: "ai",
          text: res.text,
          audioUrl: res.audio_url,
        };

        setMessages((prev) => [...prev, userMsg, aiMsg]);
      }
    } catch (err) {
      console.error(err);
      fetch(`${API_URL}/log-error`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: err.message || String(err),
          stack: err.stack || "",
          url: window.location.href,
        }),
      }).catch(() => {});
      showAlert("Не удалось расшифровать голос");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      className="container page-transition"
      style={{
        paddingBottom: "0.5rem",
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 160px)",
        boxSizing: "border-box",
      }}
    >
      {/* Header Info */}
      <div
        className="glass-card"
        style={{
          padding: "1rem",
          borderRadius: "4px",
          marginBottom: "1rem",
          display: "flex",
          alignItems: "center",
          gap: "0.8rem",
          flexShrink: 0,
          border: "1px solid var(--line)",
        }}
      >
        <button
          onClick={() => {
            haptic.impact("light");
            navigate(-1);
          }}
          style={{
            background: "none",
            border: "none",
            color: "var(--ink-soft)",
            cursor: "pointer",
            padding: "0.4rem",
            marginRight: "-0.2rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 0,
          }}
        >
          <ArrowLeftIcon width={20} height={20} strokeWidth={1.5} />
        </button>
        <div
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "50%",
            background: "var(--champagne-tint)",
            border: "1px solid var(--champagne)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--wine)",
          }}
        >
          <SparklesIcon width={18} height={18} strokeWidth={1.4} />
        </div>
        <div>
          <h2
            style={{
              fontSize: "1.1rem",
              marginBottom: "0.1rem",
              color: "var(--ink)",
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontWeight: 400,
            }}
          >
            Цифровой флорист
          </h2>
          <p
            style={{
              fontSize: "0.72rem",
              color: "var(--ink-soft)",
              margin: 0,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
          >
            Голосом или текстом
          </p>
        </div>
      </div>

      {/* Messages / Dialogue viewport */}
      <div
        ref={chatViewportRef}
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          padding: "0.9rem",
          marginBottom: "1rem",
          background: "var(--ivory-warm)",
          borderRadius: "4px",
          border: "1px solid var(--line)",
        }}
      >
        {messages.length === 0 ? (
          <div
            style={{
              margin: "auto",
              textAlign: "center",
              padding: "2rem",
              color: "var(--text-muted)",
              fontSize: "0.85rem",
            }}
          >
            <img
              src={robotAvatar}
              alt="AI Guide"
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                marginBottom: "1rem",
                border: "2px solid var(--gold)",
                boxShadow: "0 4px 12px rgba(201,168,76,0.3)",
                display: "inline-block",
              }}
            />
            <p style={{ margin: "0 0 0.5rem 0" }}>
              Спросите меня о рапэ, микродозинге или правилах проведения
              церемоний.
            </p>
            <span style={{ fontSize: "0.75rem", opacity: 0.8 }}>
              Нажмите на микрофон внизу, чтобы говорить голосом.
            </span>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                maxWidth: "85%",
                display: "flex",
                flexDirection: "column",
                gap: "0.3rem",
              }}
            >
              <div
                style={{
                  padding: "0.75rem 1rem",
                  borderRadius:
                    msg.sender === "user"
                      ? "14px 14px 4px 14px"
                      : "14px 14px 14px 4px",
                  background:
                    msg.sender === "user" ? "var(--wine)" : "var(--ivory)",
                  color: msg.sender === "user" ? "var(--ivory)" : "var(--ink)",
                  border:
                    msg.sender === "user"
                      ? "1px solid var(--wine)"
                      : "1px solid var(--line)",
                }}
              >
                <div style={{ fontSize: "0.9rem", lineHeight: 1.5 }}>
                  {msg.text}
                </div>

                {/* Audio voice node player inside AI response */}
                {msg.sender === "ai" && msg.audioUrl && (
                  <button
                    onClick={() => playAudio(msg.audioUrl, msg.id)}
                    style={{
                      marginTop: "0.6rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      fontSize: "0.75rem",
                      padding: "0.3rem 0.6rem",
                      borderRadius: "8px",
                      background: "rgba(255,255,255,0.1)",
                      color: "var(--gold)",
                      border: "none",
                      width: "fit-content",
                      cursor: "pointer",
                      marginBottom: 0,
                    }}
                  >
                    <Volume2Icon
                      width={14} height={14}
                      className={isPlayingId === msg.id ? "pulse" : ""}
                    />
                    <span>
                      {isPlayingId === msg.id ? "⏸ Пауза" : "🔊 Слушать"}
                    </span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}

        {isProcessing && (
          <div
            style={{
              alignSelf: "flex-start",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.8rem 1rem",
              borderRadius: "18px 18px 18px 2px",
              background: "rgba(255,255,255,0.02)",
              border: "1px solid var(--glass-border)",
              color: "var(--text-muted)",
              fontSize: "0.8rem",
            }}
          >
            <span
              className="spinner"
              style={{ width: "14px", height: "14px", margin: 0 }}
            ></span>
            <span>ИИ-проводник думает...</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* MicIcon Waves / Pulsing animation block when recording */}
      {isRecording && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.8rem",
            padding: "1rem",
            background: "rgba(219,68,85,0.08)",
            borderRadius: "16px",
            border: "1px solid rgba(219,68,85,0.2)",
            marginBottom: "1rem",
            flexShrink: 0,
          }}
          className="pulse"
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <span
              style={{
                width: "6px",
                height: "16px",
                background: "var(--red)",
                borderRadius: "3px",
              }}
              className="audio-wave-bar-1"
            ></span>
            <span
              style={{
                width: "6px",
                height: "24px",
                background: "var(--red)",
                borderRadius: "3px",
              }}
              className="audio-wave-bar-2"
            ></span>
            <span
              style={{
                width: "6px",
                height: "12px",
                background: "var(--red)",
                borderRadius: "3px",
              }}
              className="audio-wave-bar-3"
            ></span>
            <span
              style={{
                width: "6px",
                height: "28px",
                background: "var(--red)",
                borderRadius: "3px",
              }}
              className="audio-wave-bar-4"
            ></span>
            <span
              style={{
                width: "6px",
                height: "18px",
                background: "var(--red)",
                borderRadius: "3px",
              }}
              className="audio-wave-bar-5"
            ></span>
          </div>
          <span
            style={{
              fontSize: "0.75rem",
              color: "var(--red)",
              fontWeight: "bold",
            }}
          >
            🎙 Идет запись... Нажмите еще раз для отправки
          </span>
        </div>
      )}

      {/* Input panel (Voice + Text input) */}
      <div
        style={{
          display: "flex",
          gap: "0.6rem",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        {/* Voice recorder button */}
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
          style={{
            width: "56px",
            height: "56px",
            padding: 0,
            borderRadius: "50%",
            background: isRecording ? "var(--red)" : "var(--gold)",
            color: isRecording ? "#fff" : "#000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "none",
            flexShrink: 0,
            cursor: "pointer",
            marginBottom: 0,
            boxShadow: isRecording
              ? "0 0 20px var(--red)"
              : "0 4px 14px rgba(201,168,76,0.3)",
          }}
        >
          {isRecording ? <SquareIcon width={24} height={24} /> : <MicIcon width={24} height={24} />}
        </button>

        {/* Text input prompt */}
        <div
          style={{
            flex: 1,
            display: "flex",
            gap: "0.4rem",
            background: "rgba(255,255,255,0.02)",
            border: "1px solid var(--glass-border)",
            borderRadius: "24px",
            padding: "0.2rem 0.5rem 0.2rem 1rem",
            alignItems: "center",
          }}
        >
          <input
            type="text"
            placeholder="Написать вопрос..."
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendText()}
            disabled={isRecording || isProcessing}
            style={{
              flex: 1,
              background: "none",
              border: "none",
              color: "var(--text)",
              fontSize: "0.85rem",
              padding: "0.5rem 0",
              outline: "none",
              boxShadow: "none",
              marginBottom: 0,
            }}
          />
          <button
            onClick={handleSendText}
            disabled={isRecording || isProcessing || !textInput.trim()}
            style={{
              width: "36px",
              height: "36px",
              padding: 0,
              borderRadius: "50%",
              background: textInput.trim()
                ? "var(--gold)"
                : "rgba(255,255,255,0.08)",
              color: textInput.trim() ? "#000" : "rgba(255,255,255,0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "none",
              cursor: "pointer",
              marginBottom: 0,
              flexShrink: 0,
              transition: "all 0.25s ease",
              boxShadow: textInput.trim()
                ? "0 2px 8px rgba(201,168,76,0.3)"
                : "none",
            }}
          >
            <SendIcon width={16} height={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
