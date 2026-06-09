import json
from youtube_transcript_api import YouTubeTranscriptApi

def main():
    video_id = 'COsyShU3l3g'
    try:
        api = YouTubeTranscriptApi()
        transcript_list = api.list_transcripts(video_id)
        transcript = transcript_list.find_transcript(['zh-TW', 'zh-Hant', 'zh-Hans', 'zh', 'en']).fetch()
        with open("transcript_COsyShU3l3g_full.json", "w", encoding="utf-8") as f:
            json.dump(transcript, f, ensure_ascii=False, indent=2)
        print("Success")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
