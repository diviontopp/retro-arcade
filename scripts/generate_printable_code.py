import os

PROJECT_ROOT = r"c:\Users\J. Shivani Divyaansh\Downloads\Computer projects\anti2"
OUTPUT_FILE = os.path.join(PROJECT_ROOT, "printable_code.txt")

# Folders to completely ignore
IGNORE_DIRS = {
    "node_modules", ".git", ".next", "dist", "build", ".gemini", 
    "dataconnect-generated", "__pycache__"
}

# Files to explicitly ignore
IGNORE_FILES = {
    "package-lock.json", ".DS_Store", "printable_code.txt", 
    "generate_printable_code.py", "yarn.lock", "pnpm-lock.yaml"
}

# Extensions to include (whitelist approach is safer for "printable code")
INCLUDE_EXTS = {
    ".js", ".jsx", ".ts", ".tsx", ".py", ".html", ".css", ".json", 
    ".md", ".yml", ".yaml", ".toml", ".gql", ".graphql"
}

# Specific files to exclude even if they match extensions (if any)
EXCLUDE_PATHS = [
    # r"src\dataconnect-generated", # Handled by IGNORE_DIRS if folder is named this
]

def is_text_file(filename):
    return any(filename.endswith(ext) for ext in INCLUDE_EXTS)

def main():
    print(f"Generating {OUTPUT_FILE}...")
    
    files_written = 0
    
    with open(OUTPUT_FILE, "w", encoding="utf-8") as outfile:
        # Walk top-down
        for root, dirs, files in os.walk(PROJECT_ROOT):
            # Modify dirs in-place to skip ignored directories
            dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
            
            # Sort for consistent output
            dirs.sort()
            files.sort()
            
            for file in files:
                if file in IGNORE_FILES:
                    continue
                
                if not is_text_file(file):
                    continue
                
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, PROJECT_ROOT)
                
                # Check for specific exclude paths if any (simple string check)
                if "dataconnect-generated" in rel_path.replace("\\", "/"):
                     continue

                try:
                    with open(full_path, "r", encoding="utf-8") as infile:
                        content = infile.read()
                        
                    header = f"\n================================================================\nFILE: {rel_path}\n================================================================\n"
                    outfile.write(header)
                    outfile.write(content)
                    outfile.write("\n")
                    files_written += 1
                    print(f"Added: {rel_path}")
                    
                except Exception as e:
                    print(f"Skipped {rel_path}: {e}")

    print(f"Done. Wrote {files_written} files to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
