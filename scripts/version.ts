#!/usr/bin/env tsx
import { execSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'
// 获取当前 git 提交历史
function getGitCommits(fromTag?: string): string[] {
  try {
    const cmd = fromTag ? `git log ${fromTag}..HEAD --oneline` : 'git log --oneline'
    const output = execSync(cmd, { encoding: 'utf-8' })
    return output.trim().split('\n').filter(Boolean)
  } catch (e) {
    return []
  }
}

// 获取最新的 tag
function getLatestTag(): string | null {
  try {
    const output = execSync('git describe --tags --abbrev=0', { encoding: 'utf-8' })
    return output.trim()
  } catch (e) {
    return null
  }
}

// 解析版本号
function parseVersion(version: string): { major: number; minor: number; patch: number } {
  const match = version.match(/v?(\d+)\.(\d+)\.(\d+)/)
  if (!match) {
    return { major: 1, minor: 0, patch: 0 }
  }
  return {
    major: Number.parseInt(match[1]),
    minor: Number.parseInt(match[2]),
    patch: Number.parseInt(match[3]),
  }
}

// 增加版本号
function bumpVersion(type: 'patch' | 'minor' | 'major' = 'patch'): string {
  const projectJsonPath = join(process.cwd(), 'src-autox/project.json')
  const packageJsonPath = join(process.cwd(), 'package.json')

  let currentVersion = '1.0.0'
  let versionCode = 1

  // 读取 project.json 版本号
  if (existsSync(projectJsonPath)) {
    const projectJson = JSON.parse(readFileSync(projectJsonPath, 'utf-8'))
    currentVersion = projectJson.versionName || '1.0.0'
    versionCode = projectJson.versionCode || 1
  }

  const { major, minor, patch } = parseVersion(currentVersion)

  let newVersion: string
  switch (type) {
    case 'major':
      newVersion = `${major + 1}.0.0`
      break
    case 'minor':
      newVersion = `${major}.${minor + 1}.0`
      break
    case 'patch':
    default:
      newVersion = `${major}.${minor}.${patch + 1}`
      break
  }

  const newVersionCode = versionCode + 1
  const newTag = `v${newVersion}`

  // 更新 project.json
  if (existsSync(projectJsonPath)) {
    const projectJson = JSON.parse(readFileSync(projectJsonPath, 'utf-8'))
    projectJson.versionName = newVersion
    projectJson.versionCode = newVersionCode
    writeFileSync(projectJsonPath, JSON.stringify(projectJson, null, 4))
    console.log(`✅ 已更新 project.json: ${currentVersion} -> ${newVersion}`)
  }

  // 更新 package.json
  if (existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
    packageJson.version = newVersion
    writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))
    console.log(`✅ 已更新 package.json: ${currentVersion} -> ${newVersion}`)
  }

  return newTag
}

// 生成 Release 文本
function generateReleaseNotes(tag: string): string {
  const latestTag = getLatestTag()
  const commits = getGitCommits(latestTag || undefined)

  const date = new Date().toISOString().split('T')[0]

  let content = `# Release ${tag}\n\n`
  content += `📅 发布日期：${date}\n\n`
  content += `## 📝 更新内容\n\n`

  if (commits.length === 0) {
    content += `- 无更新记录\n`
  } else {
    for (const commit of commits) {
      const parts = commit.split(' ')
      const hash = parts[0]
      const message = parts.slice(1).join(' ')
      content += `- ${message} (\`${hash}\`)\n`
    }
  }

  content += `\n---\n`
  content += `*此文件由 scripts/version.ts 自动生成*\n`

  return content
}

// 创建 git tag
function createTag(tag: string): void {
  try {
    execSync(`git tag -a ${tag} -m "Release ${tag}"`, { stdio: 'inherit' })
    console.log(`✅ 已创建 tag: ${tag}`)
  } catch (e) {
    console.error(`❌ 创建 tag 失败：${e}`)
    process.exit(1)
  }
}

// 主函数
function main() {
  const args = process.argv.slice(2)
  const type = (args[0] as 'patch' | 'minor' | 'major') || 'patch'
  const skipTag = args.includes('--skip-tag')
  const skipFile = args.includes('--skip-file')

  console.log('🚀 开始版本管理流程...\n')

  // 1. 增加版本号
  const newTag = bumpVersion(type)

  // 2. 生成 Release 文件
  if (!skipFile) {
    const releaseContent = generateReleaseNotes(newTag)
    const releasePath = join(process.cwd(), 'changelog', `RELEASE_${newTag}.md`)
    writeFileSync(releasePath, releaseContent, 'utf-8')
    console.log(`✅ 已生成 Release 文件：${releasePath}`)
    execSync(`git add ${releasePath}`, { stdio: 'ignore' })
  }

  // 先提交版本变更
  try {
    execSync('git add src-autox/project.json package.json', { stdio: 'ignore' })
    execSync(`git commit -m "chore: bump version to ${newTag}"`, { stdio: 'ignore' })
    console.log(`✅ 已提交版本变更`)
    // push
    execSync('git push origin master', { stdio: 'ignore' })
    console.log(`✅ 已推送代码`)
  } catch (e) {
    console.log('⚠️  版本文件无变更或已提交')
  }

  // 3. 创建 git tag
  if (!skipTag) {
    createTag(newTag)
    // 推送 tag
    try {
      execSync('git push origin master --tags', { stdio: 'ignore' })
      console.log(`✅ 已推送 tag`)
    } catch (e) {
      console.log('⚠️  推送 tag 失败')
    }
  }

  console.log(`\n🎉 完成！新版本：${newTag}`)
}

main()
