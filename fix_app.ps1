$content = [System.IO.File]::ReadAllText('app.js', [System.Text.Encoding]::UTF8)

if ($content.Contains('p.agency')) {
    Write-Host "Found p.agency - replacing..."
    
    # Replace the empty-state colspan
    $content = $content -replace 'colspan="8"><div class="empty-state"><div class="empty-icon">📋</div><h3>ยังไม่มีโครงการ</h3><p>เพิ่มโครงการด้วยปุ่ม "เพิ่มโครงการ" หรือ "นำเข้า Excel"</p></div></td></tr>`', 'colspan="9"><div class="empty-state"><div class="empty-icon">📋</div><h3>ยังไม่มีโครงการ</h3><p>เพิ่มโครงการด้วยปุ่ม "เพิ่มโครงการ" หรือ "นำเข้า Excel"</p></div></td></tr>`'
    
    # Build the new tbody block
    $newBlock = @'
  tbody.innerHTML = projects.map(p => {
    const location = [p.moo ? `หมู่ ${p.moo}` : '', p.village, p.tambon, p.amphoe, p.province].filter(Boolean).join(' ');
    return `
    <tr>
      <td><span class="td-muted">${p.id}</span></td>
      <td>${typeBadge(p.type)}</td>
      <td><strong>${p.subItem}</strong><br><span class="td-muted">${p.dimension}</span></td>
      <td class="td-muted" style="font-size:12px">${location || '-'}</td>
      <td class="td-muted">${p.quantity.toLocaleString()} ${p.unit}</td>
      <td class="budget-num">${formatBudget(p.budget)}</td>
      <td><span class="badge badge-blue">${p.budgetType}</span></td>
      <td><span class="badge badge-purple">${p.regionalOffice || '-'}</span><br><span class="td-muted" style="font-size:11px">${p.unitOrg || ''}</span></td>
      <td>
        <div class="btn-group">
          <button class="btn btn-outline btn-sm" onclick="deleteProject('${p.id}')">&#128465;</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}
'@

    # Use regex to replace the old tbody block
    $pattern = '(?s)  tbody\.innerHTML = projects\.map\(p => `.*?`\)\.join\(''''\);\r?\n\}'
    $content = [regex]::Replace($content, $pattern, $newBlock)
    
    [System.IO.File]::WriteAllText('app.js', $content, [System.Text.Encoding]::UTF8)
    Write-Host "Done!"
} else {
    Write-Host "p.agency not found - already updated"
}
