import json
import re
import zipfile
from collections import Counter
from functools import lru_cache
from pathlib import Path

from flask import current_app


class FoodReviewSentimentAnalyzer:
    def __init__(self):
        # Food-domain positive words
        self.positive_words = {
            "tasty": 2,
            "delicious": 3,
            "good": 1,
            "great": 2,
            "excellent": 3,
            "fresh": 2,
            "crispy": 2,
            "yummy": 2,
            "nice": 1,
            "amazing": 3,
            "hot": 1,
            "clean": 2,
            "affordable": 2,
            "cheap": 1,
            "quick": 1,
            "friendly": 2,
            "polite": 2,
            "recommend": 3,
            "filling": 2,
            "enough": 1,
            "worth": 2
        }

        # Food-domain negative words
        self.negative_words = {
            "bad": -2,
            "terrible": -3,
            "awful": -3,
            "cold": -2,
            "stale": -3,
            "bland": -2,
            "tasteless": -3,
            "oily": -2,
            "salty": -2,
            "burnt": -3,
            "expensive": -2,
            "overpriced": -3,
            "dirty": -3,
            "slow": -2,
            "rude": -3,
            "late": -2,
            "small": -1,
            "less": -1,
            "poor": -2,
            "disappointed": -3,
            "spoiled": -3,
            "unhygienic": -3
        }

        # Phrases give stronger meaning than single words
        self.positive_phrases = {
            "very tasty": 3,
            "really tasty": 3,
            "very good": 2,
            "really good": 2,
            "worth the price": 4,
            "value for money": 4,
            "good portion": 3,
            "large portion": 3,
            "fresh food": 3,
            "fast service": 3,
            "friendly staff": 3,
            "highly recommend": 4,
            "not bad": 2,
            "well cooked": 3,
            "served hot": 3
        }

        self.negative_phrases = {
            "not tasty": -3,
            "not fresh": -4,
            "not worth": -4,
            "small portion": -3,
            "too expensive": -4,
            "too oily": -3,
            "too salty": -3,
            "cold food": -3,
            "bad service": -3,
            "rude staff": -4,
            "long wait": -3,
            "waste of money": -4,
            "less quantity": -3,
            "poor quality": -3,
            "not enough": -3,
            "food was cold": -3
        }

        self.negation_words = {
            "not", "no", "never", "isnt", "isn't", "wasnt", "wasn't",
            "dont", "don't", "didnt", "didn't", "cannot", "cant", "can't"
        }

        self.intensity_words = {
            "very": 1.5,
            "really": 1.5,
            "extremely": 2,
            "too": 1.5,
            "so": 1.3,
            "much": 1.2
        }

        self.contrast_words = {"but", "however", "although", "though"}

        # Aspect-based categories
        self.aspect_keywords = {
            "taste": {
                "tasty", "delicious", "bland", "salty", "spicy", "oily",
                "burnt", "fresh", "stale", "yummy", "tasteless", "crispy"
            },
            "portion": {
                "portion", "quantity", "small", "large", "filling",
                "enough", "less"
            },
            "price": {
                "price", "expensive", "cheap", "affordable", "overpriced",
                "worth", "money"
            },
            "service": {
                "service", "staff", "friendly", "rude", "quick",
                "slow", "late", "wait"
            },
            "hygiene": {
                "clean", "dirty", "hygienic", "unhygienic",
                "spoiled", "fresh", "stale"
            }
        }

    def clean_text(self, text):
        text = text.lower()
        text = re.sub(r"[^a-zA-Z\s']", " ", text)
        text = re.sub(r"\s+", " ", text).strip()
        return text

    def tokenize(self, text):
        return text.split()

    def check_negation(self, words, index):
        """
        Checks whether a sentiment word has a negation word before it.
        Example: "not tasty" should become negative.
        """
        start = max(0, index - 3)
        previous_words = words[start:index]
        return any(word in self.negation_words for word in previous_words)

    def check_intensity(self, words, index):
        """
        Checks whether a sentiment word has an intensity word before it.
        Example: "very tasty" should be stronger than "tasty".
        """
        if index > 0:
            previous_word = words[index - 1]
            return self.intensity_words.get(previous_word, 1)
        return 1

    def classify_score(self, score):
        if score >= 2:
            return "Positive"
        elif score <= -2:
            return "Negative"
        else:
            return "Neutral"

    def analyze_aspects(self, words):
        """
        Gives sentiment scores for individual food review aspects.
        Example:
        Taste: Positive
        Portion: Negative
        Price: Neutral
        """
        aspect_scores = {
            "taste": 0,
            "portion": 0,
            "price": 0,
            "service": 0,
            "hygiene": 0
        }

        for word in words:
            word_score = 0

            if word in self.positive_words:
                word_score = self.positive_words[word]
            elif word in self.negative_words:
                word_score = self.negative_words[word]

            if word_score != 0:
                for aspect, keywords in self.aspect_keywords.items():
                    if word in keywords:
                        aspect_scores[aspect] += word_score

        aspect_result = {}

        for aspect, score in aspect_scores.items():
            aspect_result[aspect] = {
                "score": score,
                "sentiment": self.classify_score(score)
            }

        return aspect_result

    def analyze_review(self, review_text):
        text = self.clean_text(review_text)
        words = self.tokenize(text)

        total_score = 0
        matched_terms = []

        # 1. Phrase-level scoring
        for phrase, score in self.positive_phrases.items():
            if phrase in text:
                total_score += score
                matched_terms.append({
                    "term": phrase,
                    "type": "positive_phrase",
                    "score": score
                })

        for phrase, score in self.negative_phrases.items():
            if phrase in text:
                total_score += score
                matched_terms.append({
                    "term": phrase,
                    "type": "negative_phrase",
                    "score": score
                })

        # 2. Word-level scoring with negation and intensity
        for index, word in enumerate(words):
            word_score = 0
            sentiment_type = None

            if word in self.positive_words:
                word_score = self.positive_words[word]
                sentiment_type = "positive_word"
            elif word in self.negative_words:
                word_score = self.negative_words[word]
                sentiment_type = "negative_word"

            if word_score != 0:
                intensity_multiplier = self.check_intensity(words, index)
                word_score = word_score * intensity_multiplier

                if self.check_negation(words, index):
                    word_score = word_score * -1
                    sentiment_type = "negated_" + sentiment_type

                total_score += word_score

                matched_terms.append({
                    "term": word,
                    "type": sentiment_type,
                    "score": word_score
                })

        # 3. Contrast handling
        # If the review contains "but/however", give more importance to the second part.
        for contrast_word in self.contrast_words:
            if contrast_word in words:
                parts = text.split(contrast_word, 1)

                if len(parts) == 2:
                    second_part = parts[1]
                    second_part_score = self._simple_score(second_part)

                    # Add extra weight to the part after "but/however"
                    total_score += second_part_score * 0.5

                break

        # 4. Final classification
        sentiment = self.classify_score(total_score)

        # 5. Aspect-based sentiment
        aspect_sentiment = self.analyze_aspects(words)

        return {
            "review": review_text,
            "sentiment": sentiment,
            "sentiment_score": round(total_score, 2),
            "aspect_sentiment": aspect_sentiment,
            "matched_terms": matched_terms
        }

    def _simple_score(self, text):
        """
        Helper method for scoring the second part of a sentence after contrast words.
        """
        text = self.clean_text(text)
        words = self.tokenize(text)

        score = 0

        for word in words:
            if word in self.positive_words:
                score += self.positive_words[word]
            elif word in self.negative_words:
                score += self.negative_words[word]

        return score


PROJECT_ROOT = Path(__file__).resolve().parents[3]
TRAINING_MODELS_DIR = PROJECT_ROOT / "Models" / "Training"
SENTIMENT_MODEL_ZIP = TRAINING_MODELS_DIR / "sentiment_model.zip"
RATING_MODEL_ZIP = TRAINING_MODELS_DIR / "rating_model.zip"
MAX_MODEL_LENGTH = 256


def get_model_cache_dir() -> Path:
    cache_dir = Path(current_app.instance_path) / "ml_models"
    cache_dir.mkdir(parents=True, exist_ok=True)
    return cache_dir


def extract_model_if_needed(zip_path: Path, target_name: str) -> Path:
    if not zip_path.exists():
        raise FileNotFoundError(f"Model zip file was not found: {zip_path}")

    target_dir = get_model_cache_dir() / target_name
    config_path = target_dir / "config.json"
    model_path = target_dir / "model.safetensors"

    if config_path.exists() and model_path.exists():
        return target_dir

    target_dir.mkdir(parents=True, exist_ok=True)

    with zipfile.ZipFile(zip_path) as model_zip:
        model_zip.extractall(target_dir)

    return target_dir


def load_label_map(model_dir: Path) -> dict[int, str]:
    with (model_dir / "label_map.json").open("r", encoding="utf-8") as label_map_file:
        raw_label_map = json.load(label_map_file)

    return {int(label): value for label, value in raw_label_map.items()}


@lru_cache(maxsize=1)
def load_transformer_models():
    from transformers import AutoModelForSequenceClassification, AutoTokenizer
    import torch

    sentiment_model_dir = extract_model_if_needed(SENTIMENT_MODEL_ZIP, "sentiment_model")
    rating_model_dir = extract_model_if_needed(RATING_MODEL_ZIP, "rating_model")
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    tokenizer = AutoTokenizer.from_pretrained(sentiment_model_dir, local_files_only=True)
    sentiment_model = AutoModelForSequenceClassification.from_pretrained(
        sentiment_model_dir,
        local_files_only=True,
    ).to(device)
    rating_model = AutoModelForSequenceClassification.from_pretrained(
        rating_model_dir,
        local_files_only=True,
    ).to(device)
    sentiment_model.eval()
    rating_model.eval()

    return {
        "torch": torch,
        "device": device,
        "tokenizer": tokenizer,
        "sentiment_model": sentiment_model,
        "rating_model": rating_model,
        "sentiment_labels": load_label_map(sentiment_model_dir),
        "rating_labels": load_label_map(rating_model_dir),
    }


def predict_label(text: str, model, tokenizer, label_map: dict[int, str], torch, device):
    inputs = tokenizer(
        text,
        truncation=True,
        padding=True,
        max_length=MAX_MODEL_LENGTH,
        return_tensors="pt",
    )
    inputs = {key: value.to(device) for key, value in inputs.items()}

    with torch.no_grad():
        outputs = model(**inputs)
        probabilities = torch.softmax(outputs.logits, dim=-1)[0]
        label_index = int(torch.argmax(probabilities).item())
        confidence = float(probabilities[label_index].item())

    return label_map[label_index], round(confidence, 4)


def parse_rating_label(label: str) -> int:
    match = re.search(r"\d+", label)

    if match is None:
        return 0

    return int(match.group(0))


def predict_review_with_models(comment: str) -> dict:
    models = load_transformer_models()
    sentiment, sentiment_confidence = predict_label(
        comment,
        models["sentiment_model"],
        models["tokenizer"],
        models["sentiment_labels"],
        models["torch"],
        models["device"],
    )
    rating_label, rating_confidence = predict_label(
        comment,
        models["rating_model"],
        models["tokenizer"],
        models["rating_labels"],
        models["torch"],
        models["device"],
    )

    return {
        "sentiment": sentiment,
        "sentiment_score": sentiment_confidence,
        "predicted_rating": parse_rating_label(rating_label),
        "rating_confidence": rating_confidence,
    }


def analyze_food_item_reviews(reviews):
    """
    This function analyzes all reviews of one food item.
    It can be used in the staff/admin dashboard.

    reviews format:
    [
        {"rating": 5, "comment": "The food was tasty and fresh"},
        {"rating": 2, "comment": "The portion was small and too expensive"}
    ]
    """
    aspect_analyzer = FoodReviewSentimentAnalyzer()

    analyzed_reviews = []
    sentiment_counter = Counter()
    total_predicted_rating = 0

    for review in reviews:
        comment = review.get("comment", "")
        model_result = predict_review_with_models(comment)
        aspect_result = aspect_analyzer.analyze_review(comment)
        predicted_rating = model_result["predicted_rating"]

        if predicted_rating <= 0:
            predicted_rating = int(review.get("rating", 0))

        analyzed_reviews.append({
            "rating": predicted_rating,
            "comment": comment,
            "sentiment": model_result["sentiment"],
            "sentiment_score": model_result["sentiment_score"],
            "rating_confidence": model_result["rating_confidence"],
            "aspect_sentiment": aspect_result["aspect_sentiment"]
        })

        sentiment_counter[model_result["sentiment"]] += 1
        total_predicted_rating += predicted_rating

    review_count = len(reviews)

    if review_count == 0:
        return {
            "average_rating": 0,
            "overall_sentiment": "No Reviews",
            "sentiment_summary": {},
            "reviews": []
        }

    average_rating = total_predicted_rating / review_count

    overall_sentiment = sentiment_counter.most_common(1)[0][0]

    sentiment_summary = {
        "Positive": sentiment_counter.get("Positive", 0),
        "Neutral": sentiment_counter.get("Neutral", 0),
        "Negative": sentiment_counter.get("Negative", 0)
    }

    return {
        "average_rating": round(average_rating, 2),
        "overall_sentiment": overall_sentiment,
        "sentiment_summary": sentiment_summary,
        "reviews": analyzed_reviews
    }


# Local manual test only. Not used by the Flask application.
# Uncomment this block if you want to run this file directly while tuning the algorithm.
# if __name__ == "__main__":
#     analyzer = FoodReviewSentimentAnalyzer()
#
#     review = "The kottu was very tasty but the portion was small and too expensive."
#     result = analyzer.analyze_review(review)
#
#     print("Single Review Analysis")
#     print(result)
#
#     print("\nFood Item Overall Analysis")
#
#     sample_reviews = [
#         {
#             "rating": 5,
#             "comment": "The fried rice was delicious and served hot."
#         },
#         {
#             "rating": 2,
#             "comment": "The portion was small and the food was too expensive."
#         },
#         {
#             "rating": 4,
#             "comment": "Good taste and friendly staff."
#         },
#         {
#             "rating": 1,
#             "comment": "The food was cold and not fresh."
#         }
#     ]
#
#     food_item_result = analyze_food_item_reviews(sample_reviews)
#     print(food_item_result)
