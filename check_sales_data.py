js = open('marketing.js', 'r', encoding='utf-8').read()

# Let's search for arrays or functions containing sales reps data
for line in js.splitlines():
    if 'DEFAULT_SALES' in line or 'sales_data' in line or 'getAllSales' in line or 'DEFAULT_CLIENTS' in line:
        print(line.strip())
