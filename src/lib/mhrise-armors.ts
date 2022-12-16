interface Skill {
  name:  string
  level: number
}

interface Armor {
  part:   string
  name:   string
  skills: Skill[]
  slots:  string
}
