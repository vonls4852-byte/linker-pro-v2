"use client";
import React, { useState, useRef } from 'react';
import { Mic, Video, X } from 'lucide-react';
import { VoiceRecorderProps } from './types';

export default function VoiceRecorder({
  onSendVoice,
  onSendVideo,
  onCancel
}: VoiceRecorderProps) {
  // ==================== 1. СОСТОЯНИЯ ====================
  const [isRecording, setIsRecording] = useState(false);
  const [isLongPressing, setIsLongPressing] = useState(false);
  const [isDraggingUp, setIsDraggingUp] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<BlobPart[]>([]);
  const [isVideoMode, setIsVideoMode] = useState(false);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const startY = useRef<number>(0);
  const dragThreshold = 50;

  // ==================== 2. ФУНКЦИИ ЗАПИСИ ====================
  const startRecording = async () => {
    try {
      setIsLongPressing(true);
      setIsRecording(true);
      setRecordingTime(0);
      setAudioChunks([]);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) setAudioChunks((prev) => [...prev, event.data]);
      };

      recorder.start();

      const interval = setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 1;
          setRecordingProgress((newTime / 60) * 100);
          if (newTime >= 60) stopRecording();
          return newTime;
        });
      }, 1000);

      return () => clearInterval(interval);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        onSendVoice(audioBlob, recordingTime);
        if (mediaRecorder.stream)
          mediaRecorder.stream.getTracks().forEach((track) => track.stop());
        setMediaRecorder(null);
        setIsRecording(false);
        setIsLongPressing(false);
        setRecordingTime(0);
        setRecordingProgress(0);
        setAudioChunks([]);
      };
    }
  };

  const cancelRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      if (mediaRecorder.stream)
        mediaRecorder.stream.getTracks().forEach((track) => track.stop());
    }
    setIsRecording(false);
    setIsLongPressing(false);
    setRecordingTime(0);
    setRecordingProgress(0);
    setAudioChunks([]);
    onCancel();
  };

  // ==================== 3. ОБРАБОТЧИКИ СОБЫТИЙ ====================
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    startY.current = e.clientY;
    longPressTimer.current = setTimeout(() => {
      if (!isVideoMode) startRecording();
    }, 400);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isRecording && !isLongPressing) return;
    const deltaY = startY.current - e.clientY;
    if (deltaY > dragThreshold && !isDraggingUp) setIsDraggingUp(true);
  };

    const handleMouseUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (isRecording) {
      if (isDraggingUp) setIsDraggingUp(false);
      else stopRecording();
    } else {
      if (!isLongPressing) {
        setIsVideoMode(!isVideoMode);
        if (!isVideoMode) onSendVideo();
      }
    }
    setIsLongPressing(false);
  };

  const handleMouseLeave = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (isRecording && !isDraggingUp) stopRecording();
  };

  // ==================== 4. ВСПОМОГАТЕЛЬНЫЕ ====================
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // ==================== 5. JSX ====================
  return (
    <div className="relative">
      {isRecording ? (
        // Интерфейс записи
        <div className="flex items-center gap-3 bg-[#1a1a1a] rounded-xl px-4 py-2">
          <button
            onClick={cancelRecording}
            className="p-2 hover:bg-red-500/20 rounded-lg"
          >
            <X size={18} className="text-red-400" />
          </button>

          <div className="flex-1 flex items-center gap-3">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm text-white">{formatTime(recordingTime)}</span>
            <div className="flex-1 h-1 bg-zinc-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-500 transition-all duration-300"
                style={{ width: `${recordingProgress}%` }}
              />
            </div>
          </div>

          <div className="text-xs text-zinc-400">↑ Потяните вверх</div>
        </div>
      ) : (
        // Обычная кнопка
        <button
          ref={buttonRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          className={`
            p-3 rounded-xl transition-all relative overflow-hidden
            ${
              isVideoMode
                ? 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-400'
                : 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
            }
          `}
          title={isVideoMode ? 'Режим видео' : 'Голосовое сообщение'}
        >
          {isVideoMode ? <Video size={20} /> : <Mic size={20} />}
          {isLongPressing && !isRecording && (
            <span className="absolute inset-0 animate-ping bg-current opacity-30 rounded-xl" />
          )}
        </button>
      )}
    </div>
  );
}