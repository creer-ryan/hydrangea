js = open('customer.js', 'r', encoding='utf-8').read()
braces = 0
parens = 0
brackets = 0
for i, l in enumerate(js.splitlines()):
    braces += l.count('{') - l.count('}')
    parens += l.count('(') - l.count(')')
    brackets += l.count('[') - l.count(']')
print(f"Braces: {braces}, Parens: {parens}, Brackets: {brackets}")
