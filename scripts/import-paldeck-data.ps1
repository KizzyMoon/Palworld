$ErrorActionPreference = "Stop"

$baseUrl = "https://api.paldeck.cc"
$letters = "abcdefghijklmnopqrstuvwxyz".ToCharArray()
$palUrls = [ordered]@{}

foreach ($letter in $letters) {
  $searchUrl = "$baseUrl/api/search?q=$letter"
  $results = Invoke-RestMethod -Uri $searchUrl -TimeoutSec 40
  foreach ($item in $results) {
    if ($item.type -eq "pal" -and $item.name -and $item.url -match "^/pals/" -and $item.name -notmatch "_Tower$") {
      $palUrls[$item.name] = $item.url
    }
  }
}

function HtmlDecode([string]$value) {
  if ($null -eq $value) { return "" }
  return [System.Net.WebUtility]::HtmlDecode(($value -replace "<!-- -->", "" -replace "<.*?>", "").Trim())
}

function TsString([string]$value) {
  if ($null -eq $value) { return '""' }
  return '"' + (($value -replace "\\", "\\") -replace '"', '\"' -replace "`r", "" -replace "`n", " ").Trim() + '"'
}

function TsStringArray($values) {
  $items = @($values | Where-Object { $_ } | Select-Object -Unique | ForEach-Object { TsString $_ })
  if ($items.Count -eq 0) { return "[]" }
  return "[" + ($items -join ", ") + "]"
}

function PalKey([string]$name) {
  return ($name.ToLowerInvariant() -replace "[^a-z0-9]+", "-" -replace "^-|-$", "")
}

function ExtractSection([string]$html, [string]$heading) {
  $start = $html.IndexOf(">$heading</h3>")
  if ($start -lt 0) { return "" }
  $next = $html.IndexOf("<h3", $start + $heading.Length)
  if ($next -lt 0) { $next = [Math]::Min($html.Length, $start + 12000) }
  return $html.Substring($start, $next - $start)
}

$pals = New-Object System.Collections.Generic.List[object]
$resources = [ordered]@{}
$i = 0

foreach ($entry in $palUrls.GetEnumerator()) {
  $i++
  $palName = [string]$entry.Key
  Write-Host "[$i/$($palUrls.Count)] $palName"
  $detailUrl = "$baseUrl$($entry.Value)"
  $html = (Invoke-WebRequest -UseBasicParsing -Uri $detailUrl -TimeoutSec 40).Content

  $title = [regex]::Match($html, "<title>(.*?)</title>", "Singleline").Groups[1].Value
  $numberText = [regex]::Match($title, "#([0-9]+[A-Z]?)").Groups[1].Value
  $numberDigits = $numberText -replace "[^0-9]", ""
  $number = if ($numberDigits) { [int]$numberDigits } else { 0 }

  $description = [System.Net.WebUtility]::HtmlDecode([regex]::Match($html, '<meta name="description" content="([^"]*)"', "Singleline").Groups[1].Value)
  $image = [regex]::Match($html, '<link rel="preload" as="image" href="([^"]*?/assets/palworld/pals/[^"]+)"', "Singleline").Groups[1].Value
  if (-not $image) {
    $image = [regex]::Match($html, '<img src="([^"]*?/assets/palworld/pals/[^"]+)"[^>]*alt="' + [regex]::Escape($palName) + '"', "Singleline").Groups[1].Value
  }
  if ($image -and $image.StartsWith("/")) { $image = "$baseUrl$image" }

  $mainStart = $html.IndexOf("<main")
  $loreStart = $html.IndexOf(">Lore</h3>")
  $headerHtml = if ($mainStart -ge 0 -and $loreStart -gt $mainStart) { $html.Substring($mainStart, $loreStart - $mainStart) } else { $html }
  $elements = [regex]::Matches($headerHtml, '<img src="[^"]*/assets/palworld/elements/[^"]+" alt="([^"]+)"') |
    ForEach-Object { HtmlDecode $_.Groups[1].Value } |
    Where-Object { $_ -and $_ -notmatch "^T_" } |
    Select-Object -Unique

  $workSection = ExtractSection $html "Work Suitability"
  $work = [regex]::Matches($workSection, '<img src="[^"]*/assets/palworld/work/[^"]+" alt="([^"]+)".*?<span class="text-xs text-blue-400 font-semibold">Lv\s*([0-9]+)</span>', "Singleline") |
    ForEach-Object {
      [pscustomobject]@{
        type = HtmlDecode $_.Groups[1].Value
        level = [int]$_.Groups[2].Value
      }
    }

  $partnerSection = ExtractSection $html "Partner Skill"
  $partnerName = HtmlDecode ([regex]::Match($partnerSection, '<h4[^>]*>(.*?)</h4>', "Singleline").Groups[1].Value)
  $partnerDescription = HtmlDecode ([regex]::Match($partnerSection, '<p[^>]*>(.*?)</p>', "Singleline").Groups[1].Value)

  $dropSection = ExtractSection $html "Drops"
  $drops = New-Object System.Collections.Generic.List[object]
  foreach ($drop in [regex]::Matches($dropSection, '<a class="group relative block" href="/items/([^"]+)".*?<img src="([^"]+)" alt="([^"]+)".*?<span class="text-sm text-gray-400">(.*?)</span>.*?<span class="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm font-bold">(.*?)</span>', "Singleline")) {
    $resourceId = [System.Net.WebUtility]::UrlDecode($drop.Groups[1].Value).ToLowerInvariant() -replace "[^a-z0-9]+", "-"
    $resourceName = HtmlDecode $drop.Groups[3].Value
    $quantity = HtmlDecode $drop.Groups[4].Value
    $chance = HtmlDecode $drop.Groups[5].Value
    $drops.Add([pscustomobject]@{
      resourceId = $resourceId
      notes = "$quantity, $chance"
    })
    if (-not $resources.Contains($resourceId)) {
      $resources[$resourceId] = [pscustomobject]@{
        id = $resourceId
        name = $resourceName
        image = if ($drop.Groups[2].Value.StartsWith("/")) { "$baseUrl$($drop.Groups[2].Value)" } else { $drop.Groups[2].Value }
        category = "Pal drops"
        palSources = New-Object System.Collections.Generic.List[object]
      }
    }
    $resources[$resourceId].palSources.Add([pscustomobject]@{ palName = $palName; name = "Dropped by $palName"; notes = "$quantity, $chance" })
  }

  $palRecord = New-Object psobject
  $palRecord | Add-Member -NotePropertyName id -NotePropertyValue $number
  $palRecord | Add-Member -NotePropertyName paldeckNumber -NotePropertyValue $numberText
  $palRecord | Add-Member -NotePropertyName key -NotePropertyValue (PalKey $palName)
  $palRecord | Add-Member -NotePropertyName name -NotePropertyValue $palName
  $palRecord | Add-Member -NotePropertyName image -NotePropertyValue $image
  $palRecord | Add-Member -NotePropertyName elements -NotePropertyValue @($elements)
  $palRecord | Add-Member -NotePropertyName description -NotePropertyValue $description
  $palRecord | Add-Member -NotePropertyName work -NotePropertyValue @($work)
  $palRecord | Add-Member -NotePropertyName partnerName -NotePropertyValue $partnerName
  $palRecord | Add-Member -NotePropertyName partnerDescription -NotePropertyValue $partnerDescription
  $palRecord | Add-Member -NotePropertyName drops -NotePropertyValue @($drops.ToArray())
  $palRecord | Add-Member -NotePropertyName alpha -NotePropertyValue ($palName -match "Alpha")
  $palRecord | Add-Member -NotePropertyName legendary -NotePropertyValue ($palName -match "Jetragon|Paladius|Necromus|Frostallion")
  [void]$pals.Add($palRecord)

  Start-Sleep -Milliseconds 80
}

$pals = @($pals | Where-Object { $_.id -gt 0 -and $_.name -notmatch "_Tower$" } | Sort-Object id, name)
$palIdByName = @{}
for ($index = 0; $index -lt $pals.Count; $index++) {
  $pals[$index].id = $index + 1
  $palIdByName[$pals[$index].name] = $pals[$index].id
}

$lines = New-Object System.Collections.Generic.List[string]
$lines.Add('import type { BreedingCombination, Location, Pal, Resource } from "./types";')
$lines.Add("")
$lines.Add("export const metadata = {")
$lines.Add('  appVersion: "0.2.0",')
$lines.Add('  datasetVersion: "paldeck-import-2026-07-17",')
$lines.Add('  gameVersion: "Imported from Paldeck pages on 2026-07-17; verify before relying on breeding or habitat details",')
$lines.Add('  lastUpdated: "2026-07-17",')
$lines.Add("};")
$lines.Add("")
$lines.Add("export const locations: Location[] = [")
$lines.Add('  { id: "unknown", name: "Information not currently available.", description: "Habitat import is not complete yet." },')
$lines.Add("];")
$lines.Add("")
$lines.Add("export const resources: Resource[] = [")
foreach ($resource in $resources.Values | Sort-Object name) {
  $lines.Add("  {")
  $lines.Add("    id: $(TsString $resource.id),")
  $lines.Add("    name: $(TsString $resource.name),")
  $lines.Add("    image: $(TsString $resource.image),")
  $lines.Add('    category: "Pal drops",')
  $lines.Add("    description: $(TsString "Imported Pal drop resource. Uses and non-Pal acquisition methods still need verification."),")
  $lines.Add("    usedFor: [],")
  $lines.Add("    obtainedFrom: [")
  foreach ($source in ($resource.palSources | Sort-Object palName -Unique)) {
    if ($palIdByName.ContainsKey($source.palName)) {
      $lines.Add("      { type: `"pal-drop`", name: $(TsString $source.name), palId: $($palIdByName[$source.palName]), notes: $(TsString $source.notes) },")
    }
  }
  $lines.Add("    ],")
  $lines.Add("  },")
}
$lines.Add("];")
$lines.Add("")
$lines.Add("export const pals: Pal[] = [")
foreach ($pal in $pals) {
  $lines.Add("  {")
  $lines.Add("    id: $($pal.id),")
  $lines.Add("    paldeckNumber: $(TsString $pal.paldeckNumber),")
  $lines.Add("    key: $(TsString $pal.key),")
  $lines.Add("    name: $(TsString $pal.name),")
  $lines.Add("    image: $(TsString $pal.image),")
  $lines.Add("    elements: $(TsStringArray $pal.elements),")
  $lines.Add("    description: $(TsString $pal.description),")
  $lines.Add("    workSuitability: [")
  foreach ($workItem in $pal.work) {
    $lines.Add("      { type: $(TsString $workItem.type), level: $($workItem.level) },")
  }
  $lines.Add("    ],")
  if ($pal.partnerName) {
    $lines.Add("    partnerSkill: { name: $(TsString $pal.partnerName), description: $(TsString $pal.partnerDescription) },")
  }
  $lines.Add("    possibleDrops: [")
  foreach ($drop in $pal.drops) {
    $lines.Add("      { resourceId: $(TsString $drop.resourceId), notes: $(TsString $drop.notes) },")
  }
  $lines.Add("    ],")
  $lines.Add("    habitats: [],")
  if ($pal.legendary) { $lines.Add("    legendary: true,") }
  if ($pal.alpha) { $lines.Add("    alpha: true,") }
  $lines.Add("  },")
}
$lines.Add("];")
$lines.Add("")
$lines.Add("export const breeding: BreedingCombination[] = [];")

Set-Content -LiteralPath "src/data.ts" -Value $lines -Encoding utf8
Write-Host "Imported $($pals.Count) Pals and $($resources.Count) resources."
