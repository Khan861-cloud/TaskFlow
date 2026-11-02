from app.core.security import hash_password, verify_password

password = "MySecurePassword123"

hashed_password = hash_password(password)

print("Original password:", password)
print("Hashed password:", hashed_password)

print("Correct password:", verify_password(password, hashed_password))

print("Incorrect password:", verify_password("WrongPassword", hashed_password))
