import json
from youtube_transcript_api import YouTubeTranscriptApi

def main():
    video_id = 'lxp0JS7aygo'
    try:
        transcript = YouTubeTranscriptApi.get_transcript(video_id, languages=['zh-TW', 'zh-HK', 'zh-Hant', 'zh', 'en'])
        with open("transcript_lxp0JS7aygo.json", "w", encoding="utf-8") as f:
            json.dump(transcript, f, ensure_ascii=False, indent=2)
        print("Success: transcript_lxp0JS7aygo.json created")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
