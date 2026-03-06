import re

with open("src/app/(authenticated)/page.tsx", "r") as f:
    content = f.read()

# Remove unused imports
content = content.replace("import { Button } from '@/components/ui/button';\n", "")
content = content.replace("import { CreateProjectDialog } from '@/components/create-project-dialog';\n", "")
content = content.replace("import { Layout, Radio, CheckSquare, Plus } from 'lucide-react';", "import { Layout, Radio, CheckSquare } from 'lucide-react';")

with open("src/app/(authenticated)/page.tsx", "w") as f:
    f.write(content)
