from youtube_transcript_api import YouTubeTranscriptApi
try:
    print(YouTubeTranscriptApi.list_transcripts)
except AttributeError as e:
    print(e)
