#!/bin/bash

# Process all PDF files in current directory; each PDF gets its own CSV (class name = PDF basename)
shopt -s nullglob
files=(*.pdf)
if [[ ${#files[@]} -eq 0 ]]; then
    echo "No PDF files found." >&2
    exit 1
fi

for INPUT in "${files[@]}"; do
    [[ -f "$INPUT" ]] || continue
    OUTPUT="${INPUT%.pdf}.csv"

    # Print CSV header for this class: FirstName, LastName, GradeId, GuardianPhone
    echo "FirstName, LastName, GradeId, GuardianPhone" > "$OUTPUT"

    pdftotext "$INPUT" - 2>/dev/null | awk '
# Strip leading form feed / whitespace from line
function trim(s) {
    gsub(/^\x0c|[[:space:]]+/, "", s)
    gsub(/[[:space:]]+$/, "", s)
    return s
}
# Capitalize each word (e.g. "JOHN SMITH" -> "John Smith")
function title_case(s,    n, words, i, w, result) {
    n = split(tolower(s), words, " ")
    result = ""
    for (i = 1; i <= n; i++) {
        w = words[i]
        if (length(w) > 0) result = result (result ? " " : "") toupper(substr(w, 1, 1)) substr(w, 2)
    }
    return result
}
# Normalize phone to 260XXXXXXXXX (Zambia country code + 9 digits)
function guardian_phone(p) {
    gsub(/[^0-9]/, "", p)
    if (p ~ /^260[0-9]{9}$/) return p
    if (p ~ /^0[0-9]{9}$/) return "260" substr(p, 2)
    if (p ~ /^[0-9]{9}$/) return "260" p
    return "260" p
}
function is_ui_line(s) {
    if (s == "" || length(s) == 0) return 1
    if (s ~ /LUAPULA|^Home$|Inputs|Management|Reports|Sign Out|Remove$|^CLASS:|PRESENT|Lab_id|Guardians|Enter |Child|Add A|^SAVE$|Gender|Mobile|Airtel|Grade|Class|Pupil|Record\?|Family Name/) return 1
    if (s ~ /^\s*$/) return 1
    return 0
}
BEGIN { state = 0 }
{
    line = trim($0)
    if (is_ui_line(line)) next
    if (state == 0) {
        if (line ~ /^[0-9]+$/) { state = 1; next }
        next
    }
    if (state == 1) {
        # Last name (letters, possibly with spaces e.g. "M SARA"); exclude single F/M
        if (line ~ /^[A-Za-z][A-Za-z ]*$/ && length(line) > 1 && line != "F" && line != "M") {
            last = line
            state = 2
        }
        next
    }
    if (state == 2) {
        if (line ~ /^[A-Za-z][A-Za-z ]*$/ && length(line) > 1 && line != "F" && line != "M") {
            first = line
            state = 3
        }
        next
    }
    if (state == 3) {
        if (line == "F" || line == "M") {
            state = 4
        }
        next
    }
    if (state == 4) {
        if (line ~ /^[0-9]{9,10}$/) {
            phone = guardian_phone(line)
            first = title_case(first)
            last = title_case(last)
            # CSV: escape fields that contain comma by wrapping in quotes; GradeId empty
            gsub(/"/, "\"\"", first)
            gsub(/"/, "\"\"", last)
            if (first ~ /,/ || last ~ /,/) printf "\"%s\",\"%s\",,\"%s\"\n", first, last, phone
            else printf "%s,%s,,%s\n", first, last, phone
            state = 0
        }
        next
    }
}
' | sort -u >> "$OUTPUT"

    echo "  $INPUT -> $OUTPUT ($(($(wc -l < "$OUTPUT") - 1)) students)"
done

echo "Extraction complete. One CSV per class."
