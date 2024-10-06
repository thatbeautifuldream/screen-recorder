"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";

export default function ScreenRecorder() {
  const [recording, setRecording] = useState<boolean>(false);
  const [videoURL, setVideoURL] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });

      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      // Combine screen and audio streams
      const combinedStream = new MediaStream([
        ...screenStream.getTracks(),
        ...audioStream.getTracks(),
      ]);

      setStream(combinedStream);

      // Initialize MediaRecorder
      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: "video/webm",
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        setVideoURL(url);
        chunksRef.current = []; // Clear chunks
        setStream(null);
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    }
  }, [stream]);

  useEffect(() => {
    if (liveVideoRef.current && stream) {
      liveVideoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Screen Recorder</h1>
      <button
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        onClick={recording ? stopRecording : startRecording}
      >
        {recording ? "Stop Recording" : "Start Recording"}
      </button>

      {stream && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold">Live Stream:</h2>
          <video
            ref={liveVideoRef}
            autoPlay
            muted
            className="w-full max-w-2xl border border-gray-300 rounded"
          />
        </div>
      )}

      {videoURL && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold">Recorded Video:</h2>
          <video
            src={videoURL}
            controls
            className="w-full max-w-2xl border border-gray-300 rounded"
          />
          <a
            href={videoURL}
            download="recording.webm"
            className="inline-block mt-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Download Video
          </a>
        </div>
      )}
    </div>
  );
}
