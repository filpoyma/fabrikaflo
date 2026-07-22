import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_URL } from '../../api'
import {
  useSendAiChatTextMutation,
  useSendAiVoiceFileMutation,
} from '../../api/ai'
import { useTelegram } from '../../hooks/useTelegram'
import { IconButton, cx } from '../../shared/ui'
import type { IAiChatMessage } from '../../types/ui.ts'
import MicIcon from '../../assets/icons/mic.svg'
import SendIcon from '../../assets/icons/send.svg'
import SquareIcon from '../../assets/icons/square.svg'
import Volume2Icon from '../../assets/icons/volume-2.svg'
import SparklesIcon from '../../assets/icons/sparkles.svg'
import ArrowLeftIcon from '../../assets/icons/arrow-left.svg'
import robotAvatar from '../../assets/ai_guide_avatar.jpg'
import styles from './AiGuidePage.module.css'

export default function AiGuidePage() {
  const navigate = useNavigate()
  const { haptic, showAlert } = useTelegram()
  const sendTextMutation = useSendAiChatTextMutation()
  const sendVoiceMutation = useSendAiVoiceFileMutation()

  const [messages, setMessages] = useState<IAiChatMessage[]>([])
  const [textInput, setTextInput] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isPlayingId, setIsPlayingId] = useState<number | string | null>(null)

  const chatViewportRef = useRef<HTMLDivElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  useEffect(() => {
    const originalStyle = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.scrollTo(0, 0)

    return () => {
      document.body.style.overflow = originalStyle
    }
  }, [])

  useEffect(() => {
    if (chatViewportRef.current) {
      chatViewportRef.current.scrollTop = chatViewportRef.current.scrollHeight
    }
  }, [messages, isProcessing])

  const playAudio = (url: string, msgId: number | string) => {
    haptic.impact('light')
    if (isPlayingId === msgId) {
      audioRef.current?.pause()
      setIsPlayingId(null)
    } else {
      if (audioRef.current) {
        audioRef.current.pause()
      }
      const fullUrl = url.startsWith('/')
        ? `${API_URL.replace('/api', '')}${url}`
        : url
      audioRef.current = new Audio(fullUrl)
      audioRef.current.play().catch((err: unknown) => {
        console.warn('Autoplay blocked or audio playback failed:', err)
      })
      setIsPlayingId(msgId)
      audioRef.current.onended = () => {
        setIsPlayingId(null)
      }
    }
  }

  const handleSendText = async () => {
    if (!textInput.trim()) return
    const prompt = textInput.trim()
    setTextInput('')
    haptic.impact('medium')

    const newMsg: IAiChatMessage = { id: Date.now(), sender: 'user', text: prompt }
    setMessages((prev) => [...prev, newMsg])
    setIsProcessing(true)

    try {
      const res = await sendTextMutation.mutateAsync({ prompt })
      if (res.ok) {
        haptic.success()
        const replyMsg: IAiChatMessage = {
          id: Date.now() + 1,
          sender: 'ai',
          text: res.text ?? '',
          audioUrl: res.audio_url,
        }
        setMessages((prev) => [...prev, replyMsg])
      } else {
        showAlert('Ошибка ответа ИИ')
      }
    } catch (err: unknown) {
      console.error(err)
      const error = err instanceof Error ? err : new Error(String(err))
      fetch(`${API_URL}/log-error`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack || '',
          url: window.location.href,
        }),
      }).catch(() => {})
      showAlert('Ошибка связи с ИИ')
    } finally {
      setIsProcessing(false)
    }
  }

  const startRecording = async () => {
    haptic.impact('heavy')
    audioChunksRef.current = []
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      let options = { mimeType: 'audio/webm' }
      if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
        options = { mimeType: 'audio/ogg;codecs=opus' }
      }

      mediaRecorderRef.current = new MediaRecorder(stream, options)
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: options.mimeType,
        })
        await handleSendVoice(audioBlob)
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
    } catch (err) {
      console.error(err)
      showAlert('Доступ к микрофону отклонен')
    }
  }

  const stopRecording = () => {
    haptic.impact('medium')
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop())
      setIsRecording(false)
    }
  }

  const handleSendVoice = async (audioBlob: Blob) => {
    setIsProcessing(true)
    try {
      const res = await sendVoiceMutation.mutateAsync({ blob: audioBlob })
      if (res.ok) {
        haptic.success()
        const userMsg: IAiChatMessage = {
          id: Date.now(),
          sender: 'user',
          text: res.user_text ?? '',
        }
        const aiMsg: IAiChatMessage = {
          id: Date.now() + 1,
          sender: 'ai',
          text: res.text ?? '',
          audioUrl: res.audio_url,
        }

        setMessages((prev) => [...prev, userMsg, aiMsg])
      }
    } catch (err: unknown) {
      console.error(err)
      const error = err instanceof Error ? err : new Error(String(err))
      fetch(`${API_URL}/log-error`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack || '',
          url: window.location.href,
        }),
      }).catch(() => {})
      showAlert('Не удалось расшифровать голос')
    } finally {
      setIsProcessing(false)
    }
  }

  const hasText = Boolean(textInput.trim())

  return (
    <div className={cx('container', 'page-transition', styles.page)}>
      <div className={cx('glass-card', styles.header)}>
        <IconButton
          variant="ghost"
          onClick={() => {
            haptic.impact('light')
            navigate(-1)
          }}
          aria-label="Назад"
          className={styles.backBtn}
        >
          <ArrowLeftIcon width={20} height={20} strokeWidth={1.5} />
        </IconButton>
        <div className={styles.avatarIcon}>
          <SparklesIcon width={18} height={18} strokeWidth={1.4} />
        </div>
        <div>
          <h2 className={styles.headerTitle}>Цифровой флорист</h2>
          <p className={styles.headerSubtitle}>Голосом или текстом</p>
        </div>
      </div>

      <div ref={chatViewportRef} className={styles.chatViewport}>
        {messages.length === 0 ? (
          <div className={styles.emptyState}>
            <img src={robotAvatar} alt="AI Guide" className={styles.emptyAvatar} />
            <p className={styles.emptyText}>
              Спросите меня о рапэ, микродозинге или правилах проведения церемоний.
            </p>
            <span className={styles.emptyHint}>
              Нажмите на микрофон внизу, чтобы говорить голосом.
            </span>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={styles.messageRow} data-sender={msg.sender}>
              <div className={styles.messageBubble} data-sender={msg.sender}>
                <div className={styles.messageText}>{msg.text}</div>

                {msg.sender === 'ai' && msg.audioUrl && (
                  <IconButton
                    variant="audio"
                    onClick={() => playAudio(msg.audioUrl!, msg.id ?? msg.text)}
                    aria-label="Воспроизвести голосовой ответ"
                  >
                    <Volume2Icon
                      width={14}
                      height={14}
                      className={isPlayingId === msg.id ? 'pulse' : ''}
                    />
                    <span>{isPlayingId === msg.id ? '⏸ Пауза' : '🔊 Слушать'}</span>
                  </IconButton>
                )}
              </div>
            </div>
          ))
        )}

        {isProcessing && (
          <div className={styles.processing}>
            <span className={cx('spinner', styles.processingSpinner)} />
            <span>ИИ-проводник думает...</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {isRecording && (
        <div className={cx(styles.recordingPanel, 'pulse')}>
          <div className={styles.waveBars}>
            <span className={cx(styles.waveBar, styles.waveBar1, 'audio-wave-bar-1')} />
            <span className={cx(styles.waveBar, styles.waveBar2, 'audio-wave-bar-2')} />
            <span className={cx(styles.waveBar, styles.waveBar3, 'audio-wave-bar-3')} />
            <span className={cx(styles.waveBar, styles.waveBar4, 'audio-wave-bar-4')} />
            <span className={cx(styles.waveBar, styles.waveBar5, 'audio-wave-bar-5')} />
          </div>
          <span className={styles.recordingLabel}>
            🎙 Идет запись... Нажмите еще раз для отправки
          </span>
        </div>
      )}

      <div className={styles.inputPanel}>
        <IconButton
          variant={isRecording ? 'fabRecording' : 'fab'}
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
          aria-label={isRecording ? 'Остановить запись' : 'Начать запись'}
        >
          {isRecording ? (
            <SquareIcon width={24} height={24} />
          ) : (
            <MicIcon width={24} height={24} />
          )}
        </IconButton>

        <div className={styles.textInputWrap}>
          <input
            type="text"
            placeholder="Написать вопрос..."
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
            disabled={isRecording || isProcessing}
            className={styles.textInput}
          />
          <IconButton
            variant={hasText ? 'fabSmActive' : 'fabSm'}
            onClick={handleSendText}
            disabled={isRecording || isProcessing || !hasText}
            aria-label="Отправить сообщение"
            className={hasText ? styles.sendBtnActive : undefined}
          >
            <SendIcon width={16} height={16} />
          </IconButton>
        </div>
      </div>
    </div>
  )
}
