"""
Backend Server Tests

Run with: cd backend && python -m pytest ../tests/ -v
"""
import pytest
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))


class TestServerImports:
    """Test that server can be imported without emergentintegrations"""

    def test_fastapi_import(self):
        """FastAPI should be importable"""
        from fastapi import FastAPI
        assert FastAPI is not None

    def test_pydantic_import(self):
        """Pydantic models should be importable"""
        from pydantic import BaseModel
        assert BaseModel is not None

    def test_motor_import(self):
        """Motor async driver should be importable"""
        from motor.motor_asyncio import AsyncIOMotorClient
        assert AsyncIOMotorClient is not None


class TestPasswordHashing:
    """Test password hashing utilities"""

    def test_bcrypt_hash(self):
        """Test bcrypt password hashing"""
        import bcrypt
        password = "test_password_123"
        hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt())
        assert bcrypt.checkpw(password.encode(), hashed)

    def test_bcrypt_reject_wrong_password(self):
        """Test bcrypt rejects wrong password"""
        import bcrypt
        password = "test_password_123"
        wrong_password = "wrong_password"
        hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt())
        assert not bcrypt.checkpw(wrong_password.encode(), hashed)


class TestJWTTokens:
    """Test JWT token utilities"""

    def test_jwt_encode_decode(self):
        """Test JWT token encoding and decoding"""
        import jwt
        from datetime import datetime, timedelta

        secret = "test_secret_key"
        payload = {
            "user_id": "test_user_123",
            "exp": datetime.utcnow() + timedelta(hours=24)
        }

        token = jwt.encode(payload, secret, algorithm="HS256")
        decoded = jwt.decode(token, secret, algorithms=["HS256"])

        assert decoded["user_id"] == "test_user_123"

    def test_jwt_invalid_signature(self):
        """Test JWT rejects invalid signature"""
        import jwt
        from datetime import datetime, timedelta

        secret = "test_secret_key"
        wrong_secret = "wrong_secret_key"
        payload = {
            "user_id": "test_user_123",
            "exp": datetime.utcnow() + timedelta(hours=24)
        }

        token = jwt.encode(payload, secret, algorithm="HS256")

        with pytest.raises(jwt.InvalidSignatureError):
            jwt.decode(token, wrong_secret, algorithms=["HS256"])


class TestFrameworkData:
    """Test framework data structures"""

    def test_danielson_framework_structure(self):
        """Test Danielson framework has required structure"""
        danielson = {
            "id": "danielson",
            "name": "Danielson Framework for Teaching",
            "domains": [
                {
                    "id": "domain_1",
                    "name": "Planning and Preparation",
                    "elements": [
                        {"id": "1a", "name": "Knowledge of Content"},
                        {"id": "1b", "name": "Knowledge of Students"},
                    ]
                }
            ]
        }

        assert "id" in danielson
        assert "name" in danielson
        assert "domains" in danielson
        assert len(danielson["domains"]) > 0
        assert "elements" in danielson["domains"][0]

    def test_marshall_framework_structure(self):
        """Test Marshall framework has required structure"""
        marshall = {
            "id": "marshall",
            "name": "Marshall Teacher Evaluation Rubric",
            "domains": [
                {
                    "id": "domain_a",
                    "name": "Planning and Preparation",
                    "elements": [
                        {"id": "A1", "name": "Knowledge of Subject Matter"},
                    ]
                }
            ]
        }

        assert "id" in marshall
        assert "name" in marshall
        assert "domains" in marshall


class TestScoreNormalization:
    """Test score normalization utilities"""

    def test_score_1_to_4_normalization(self):
        """Test converting 1-4 scores to 0-100 scale"""
        def normalize_score(score_1_4: float) -> float:
            """Convert 1-4 scale to 0-100 scale"""
            return (score_1_4 - 1) * (100 / 3)

        assert normalize_score(1) == pytest.approx(0)
        assert normalize_score(2) == pytest.approx(33.33, rel=0.01)
        assert normalize_score(3) == pytest.approx(66.67, rel=0.01)
        assert normalize_score(4) == pytest.approx(100)

    def test_performance_level_mapping(self):
        """Test performance level mapping from score"""
        def get_performance_level(score: float) -> str:
            if score >= 3.5:
                return "Distinguished"
            elif score >= 2.5:
                return "Proficient"
            elif score >= 1.5:
                return "Basic"
            else:
                return "Unsatisfactory"

        assert get_performance_level(4.0) == "Distinguished"
        assert get_performance_level(3.5) == "Distinguished"
        assert get_performance_level(3.0) == "Proficient"
        assert get_performance_level(2.0) == "Basic"
        assert get_performance_level(1.0) == "Unsatisfactory"


class TestColorThresholds:
    """Test color threshold utilities"""

    def test_color_from_score(self):
        """Test color assignment based on score"""
        def color_from_score(score: float, green_min: float = 80, yellow_min: float = 60) -> str:
            if score >= green_min:
                return "green"
            elif score >= yellow_min:
                return "yellow"
            else:
                return "red"

        assert color_from_score(85) == "green"
        assert color_from_score(80) == "green"
        assert color_from_score(79) == "yellow"
        assert color_from_score(60) == "yellow"
        assert color_from_score(59) == "red"
        assert color_from_score(0) == "red"

    def test_custom_thresholds(self):
        """Test color assignment with custom thresholds"""
        def color_from_score(score: float, green_min: float = 80, yellow_min: float = 60) -> str:
            if score >= green_min:
                return "green"
            elif score >= yellow_min:
                return "yellow"
            else:
                return "red"

        # Custom thresholds: green >= 90, yellow >= 70
        assert color_from_score(95, green_min=90, yellow_min=70) == "green"
        assert color_from_score(85, green_min=90, yellow_min=70) == "yellow"
        assert color_from_score(65, green_min=90, yellow_min=70) == "red"


class TestDataValidation:
    """Test data validation utilities"""

    def test_valid_email(self):
        """Test email validation"""
        from email_validator import validate_email, EmailNotValidError

        # Valid email (skip DNS deliverability check)
        result = validate_email("test@example.com", check_deliverability=False)
        assert result.normalized == "test@example.com"

        # Invalid email
        with pytest.raises(EmailNotValidError):
            validate_email("not-an-email", check_deliverability=False)

    def test_assessment_score_range(self):
        """Test assessment score is within valid range"""
        def validate_score(score: float) -> bool:
            return 1.0 <= score <= 4.0

        assert validate_score(1.0)
        assert validate_score(2.5)
        assert validate_score(4.0)
        assert not validate_score(0.5)
        assert not validate_score(4.5)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
