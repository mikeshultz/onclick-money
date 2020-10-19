import React, { useState } from 'react'

const Input = ({ set, name, placeholder }) => {
  const [value, setValue] = useState()

  const change = (ev) => {
    ev.preventDefault()
    setValue(ev.target.value)
    if (set) {
      set(name, ev.target.value)
    }
  }

  return (
    <input
      type="text"
      name={name}
      placeholder={placeholder}
      onChange={change}
      value={value}
    />
  )
}

export default Input
