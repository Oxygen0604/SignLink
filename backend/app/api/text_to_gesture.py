@app.post("/text-to-sign")
async def text_to_sign(data: dict):
    sentence = data["sentence"]
    simplified = simplify_with_spacy(sentence)
    gesture_sequence = []
    for word in simplified:
        gesture = word_to_gesture_map.get(word, "unknown")
        gesture_sequence.append(gesture)
    return {"gesture_sequence": gesture_sequence}