'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Upload, Headphones, FileText, Zap, CircleArrowUp, ShieldCheck } from "lucide-react"
import React, { useEffect, useRef, useState } from "react"
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util'
import { dbFileDexie as db } from '@/db'
import { useLiveQuery } from 'dexie-react-hooks';
import { message, Button as ClearButton } from "antd";
import OpenAI from 'openai';


export function LandingPageComponent() {

  const [audeoSrc, setAudioSrc] = useState() as any; // output files

  const [urlName, setUrlName] = useState() as any; // output files

  const ffmpegRef = useRef(new FFmpeg());

  const messageRef = useRef(null) as any;

  const startConveresionRef = useRef<HTMLButtonElement>(null);

  const mediaList = useLiveQuery(
    () => db.files?.toArray?.()
  );

  const [mediaStatus, setMediaStatus] = useState(mediaList);

  useEffect(() => {
    console.log("mediaList", mediaList);
    if (mediaList && mediaList.length) {
      setMediaStatus(mediaList)
    } else {
      setMediaStatus([])
    }
  }, [mediaList])


  // 上传视频
  const handleFileUploade = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log("event", event);
    const file = event.target.files![0];
    if (file) {
      try {
        const { name } = file;
        if (/\s/.test(name)) {
          message.error('文件名不能存在空格');
          return;
        }
        db.files.put({ name, type: file.type, data: file })
      } catch (error) {
        console.error('handleMediaChange error', error)
      }
    };
  }

  console.log("medialist", mediaList);

  // 开始转换
  const startConveresionClick = async () => {
    // console.log("ddddd");
    console.log("medialist", mediaList);

    if (mediaStatus && mediaList.length) {

      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'
      const ffmpeg = ffmpegRef.current;
      ffmpeg.on('log', ({ message }: { message: string }) => {
        if (messageRef.current) {
          messageRef.current.innerHTML = message;
        }
      });
      // toBlobURL is used to bypass CORS issue, urls with the same
      // domain can be used directly.
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      // setLoaded(true);

      const { data: mediaData, name } = mediaList[0];

      const ffmpeg2 = ffmpegRef.current;
      await ffmpeg2.writeFile(name, await fetchFile(mediaData));
      await ffmpeg2.exec(['-i', name, name+'.mp3']);
      const data = await ffmpeg2.readFile(name+'.mp3');

      console.log("data", data);

      const blob = URL.createObjectURL(
        new Blob([data], { type: "audio/mpeg" }),
      );

      setAudioSrc(blob as any);
      setUrlName(new Date().getTime()+'.mp3')

      // setAudioUrl(()=>{
      //   const blobUrl = URL.createObjectURL();
        

      // })

      // console.log("process.env.OPENAI_API_KEY", process.env.OPENAI_API_KEY)
      
      return
      const openai = new OpenAI({
        // apiKey: process.env.OPENAI_API_KEY // This is also the default, can be omitted
        apiKey: "sk-W2BkVvwfVOMutIZhC5A51eFf127a47D4814127Cf6117FbDa",
        dangerouslyAllowBrowser: true,
        // baseURL: "https://xiaoai.plus/v1"
      });

      const response = await openai.audio.transcriptions.create({
        model: 'whisper-1',
        file: data,
      });

      console.log("chatgpt", response)

    }

  }

  // 清除文件
  const clearFileClick = () => {
    if (mediaStatus && mediaList.length && db) {
      db.files.delete(mediaStatus[0].id!)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-white">
      <header className="container mx-auto px-4 py-8">
        <h1 className="text-4xl md:text-5xl font-bold text-center text-blue-600">
          视频转文字
        </h1>
        <p className="mt-4 text-xl text-center text-gray-600">
          免费、安全、快速、准确地从视频中提取音频并转换为文字
        </p>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-xl mx-auto bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-center w-full">
            <label
              htmlFor="dropzone-file"
              className="flex flex-col items-center justify-center w-full h-64 border-2 border-blue-300 border-dashed rounded-lg cursor-pointer bg-blue-50 hover:bg-blue-100"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-10 h-10 mb-3 text-blue-500" />
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">点击上传</span> 或拖放文件
                </p>
                <p className="text-xs text-gray-500">MP4, AVI, MOV (最大 100MB)</p>
              </div>
              <Input id="dropzone-file" type="file" className="hidden" onChange={handleFileUploade} />
            </label>
          </div>

          {mediaStatus && mediaStatus.length > 0 && (
            <>
              <div className="text-xs text-red-500 mt-5 ">
                {mediaStatus && mediaStatus.length > 0 ? mediaStatus[0].name : ""}
                <ClearButton type="primary" danger size="small" className="ml-2" onClick={clearFileClick}>清除</ClearButton>
              </div>

              <p ref={messageRef}></p>

              <audio src={audeoSrc}></audio>

              <ClearButton type="primary">
                <a href={audeoSrc} download={urlName}>
                  下载
                </a>
              </ClearButton>

            </>
          )}


          <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white" ref={startConveresionRef} onClick={startConveresionClick}>
            开始转换
          </Button>


        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-5 gap-8">
          <div className="text-center">
            <Headphones className="w-12 h-12 mx-auto text-blue-500" />
            <h3 className="mt-4 text-xl font-semibold">提取音频</h3>
            <p className="mt-2 text-gray-600">从视频中快速提取高质量音频</p>
          </div>
          <div className="text-center">
            <FileText className="w-12 h-12 mx-auto text-blue-500" />
            <h3 className="mt-4 text-xl font-semibold">转换文字</h3>
            <p className="mt-2 text-gray-600">使用先进的AI技术将音频转换为准确的文字</p>
          </div>
          <div className="text-center">
            <ShieldCheck className="w-12 h-12 mx-auto text-blue-500" />
            <h3 className="mt-4 text-xl font-semibold">数据安全</h3>
            <p className="mt-2 text-gray-600">帮助保护数据的隐私和安全性，不保存任何数据，数据均在本地进行处理</p>
          </div>
          <div className="text-center">
            <CircleArrowUp className="w-12 h-12 mx-auto text-blue-500" />
            <h3 className="mt-4 text-xl font-semibold">数据持久化</h3>
            <p className="mt-2 text-gray-600">确保视频文件上传后不会丢失数据，即使页面刷新</p>
          </div>
          <div className="text-center">
            <Zap className="w-12 h-12 mx-auto text-blue-500" />
            <h3 className="mt-4 text-xl font-semibold">快速处理</h3>
            <p className="mt-2 text-gray-600">高效处理，节省您的宝贵时间</p>
          </div>

        </div>

        <div className="mt-16 text-center">
          <h2 className="text-3xl font-bold text-blue-600">如何使用</h2>
          <ol className="mt-8 space-y-4 text-left max-w-md mx-auto">
            <li className="flex items-center space-x-3">
              <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-blue-500 text-white font-bold">1</span>
              <span>上传您的视频文件</span>
            </li>
            <li className="flex items-center space-x-3">
              <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-blue-500 text-white font-bold">2</span>
              <span>等待系统自动提取音频并转换为文字</span>
            </li>
            <li className="flex items-center space-x-3">
              <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-blue-500 text-white font-bold">3</span>
              <span>下载或复制生成的文字内容</span>
            </li>
          </ol>
        </div>

        <div className="mt-16 text-center">
          <Button className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg rounded-full">
            立即开始免费使用
          </Button>
        </div>
      </main>

      <footer className="mt-16 bg-gray-100 py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>&copy; 2023 音频转文字. 保留所有权利。</p>
        </div>
      </footer>
    </div>
  )
}