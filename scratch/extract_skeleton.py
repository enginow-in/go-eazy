import json

transcript_path = r'C:\Users\BSNL\.gemini\antigravity-ide\brain\803ba1fe-a342-4e7c-8cc4-b970ed147b31\.system_generated\logs\transcript_full.jsonl'
with open(transcript_path, 'r', encoding='utf-8') as f:
    for line in f:
        data = json.loads(line)
        if data.get('type') == 'PLANNER_RESPONSE':
            for tool_call in data.get('tool_calls', []):
                if tool_call['name'] in ['write_to_file', 'replace_file_content', 'multi_replace_file_content']:
                    target = tool_call['args'].get('TargetFile', '')
                    if 'Skeleton.jsx' in target:
                        print("FOUND SKELETON UPDATE:")
                        print(json.dumps(tool_call['args'], indent=2))
