import json
from youtube_transcript_api import YouTubeTranscriptApi

def main():
    video_id = 'COsyShU3l3g'
    try:
        # Try to get the list and then the transcript
        transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
        # Manually pick zh-TW or similar
        t = transcript_list.find_transcript(['zh-TW', 'zh-HK', 'zh-Hant', 'zh', 'en']).fetch()
        with open("transcript_COsyShU3l3g_61.json", "w", encoding="utf-8") as f:
            json.dump(t, f, ensure_ascii=False, indent=2)
        print("Success")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
