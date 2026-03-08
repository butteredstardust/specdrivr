grep -rn "import.*<ComponentName>\|from.*<ComponentName>" \
  app/ pages/ components/ src/ --include="*.tsx" --include="*.ts" \
  | grep -v "node_modules\|components/ui" | wc -l
