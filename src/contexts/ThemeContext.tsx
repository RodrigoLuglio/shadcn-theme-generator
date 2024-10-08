'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'

import {
  generateThemeColors,
  updateThemeColorsWithSaturation,
} from '@/lib/utils/generator'

import {
  initialColors,
  type ColorVariables,
  colorVariableMapping,
} from '@/lib/types/colors'
import type { ThemeVariables } from '@/lib/types/theme'
import { initialThemeColors, initialThemeOther } from '@/lib/types/theme'
import { ColorScheme } from '@/lib/types/schemes'
import { hexToHSL } from '@/lib/utils/color'
import { randomInteger } from '@/lib/utils/math'

export type ThemeContextType = {
  themeColors: ThemeVariables
  setThemeColors: (themeColors: ThemeVariables) => void
  themeOtherVariables: ThemeVariables
  setThemeOtherVariables: (themeOtherVariables: ThemeVariables) => void
  isDark: boolean
  setIsDark: (isDark: boolean) => void
  baseHue: number
  setBaseHue: (baseHue: number) => void
  setBaseHueState: (baseHue: number) => void
  saturation: number
  setSaturation: (saturation: number) => void
  setSaturationState: (saturation: number) => void
  scheme: ColorScheme
  setScheme: (scheme: ColorScheme) => void
  setSchemeState: (scheme: ColorScheme) => void
  colors: ColorVariables
  setColors: (colors: ColorVariables) => void
  lockedColors: Set<string>
  setLockedColors: (lockedColors: Set<string>) => void
  toggleColorLock: (colorKey: string) => void
  handleColorChange: (colorKey: string, newColor: string) => void
  handleOtherChange: (variable: string, value: string) => void
  generateColors: (
    isDark: boolean,
    newHue: number,
    newSaturation: number,
    newScheme: ColorScheme,
    lockedColors: Set<string>
  ) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<ThemeVariables>({
    ...initialThemeColors,
    ...initialThemeOther,
  })
  console.log(theme)
  const [themeColors, setThemeColors] =
    useState<ThemeVariables>(initialThemeColors)
  const [themeOtherVariables, setThemeOtherVariables] =
    useState<ThemeVariables>(initialThemeOther)
  const [isDark, setIsDarkState] = useState<boolean>(false)
  const [baseHue, setBaseHueState] = useState<number>(0)
  const [saturation, setSaturationState] = useState<number>(
    randomInteger(30, 90)
  )
  const [scheme, setSchemeState] = useState<ColorScheme>(ColorScheme.Triadic)
  const [colors, setColors] = useState<ColorVariables>(initialColors)
  const [lockedColors, setLockedColors] = useState<Set<string>>(new Set())

  const updateThemeOthers = useCallback((newOtherVariables: ThemeVariables) => {
    setThemeOtherVariables((prevThemeOtherVariables: ThemeVariables) => ({
      ...prevThemeOtherVariables,
      ...newOtherVariables,
    }))
    setTheme((prevTheme) => ({ ...prevTheme, ...newOtherVariables }))
  }, [])

  const generateColors = useCallback(
    (
      isDark: boolean,
      newHue: number,
      newSaturation: number,
      newScheme: ColorScheme,
      lockedColors: Set<string>
    ) => {
      const { colors: newColors } = generateThemeColors(
        isDark,
        newHue,
        newSaturation,
        newScheme,
        Object.fromEntries(
          Object.entries(colors).filter(([key]) => lockedColors.has(key))
        ) as Partial<ColorVariables>
      )

      const newThemeColors: ThemeVariables = {}
      const newColorState: ColorVariables = { ...newColors }
      Object.entries(newColors).forEach(([key, value]) => {
        const cssVar = Object.keys(colorVariableMapping).find(
          (k) => colorVariableMapping[k] === key
        )
        if (cssVar) {
          newThemeColors[cssVar] = value
        }
      })

      setColors(newColorState)
      setThemeColors(newThemeColors)
      setTheme((prevTheme) => ({ ...prevTheme, ...newThemeColors }))
      var r = document.querySelector(':root') as any
      Object.entries(newThemeColors).forEach(([key, value]) => {
        r.style.setProperty(key, hexToHSL(value, 'string'))
      })
    },
    [colors]
  )

  const updateColorsWithSaturation = useCallback(
    (saturation: number) => {
      setColors((prevColors) => {
        const newColors = updateThemeColorsWithSaturation(
          prevColors,
          saturation,
          lockedColors
        )
        const newThemeColors: ThemeVariables = {}
        const newColorState: ColorVariables = { ...newColors }
        Object.entries(newColors).forEach(([key, value]) => {
          const cssVar = Object.keys(colorVariableMapping).find(
            (k) => colorVariableMapping[k] === key
          )
          if (cssVar) {
            newThemeColors[cssVar] = value
          }
        })
        setColors(newColorState)
        setThemeColors(newThemeColors)
        setTheme((prevTheme) => ({ ...prevTheme, ...newThemeColors }))
        var r = document.querySelector(':root') as any
        Object.entries(newThemeColors).forEach(([key, value]) => {
          r.style.setProperty(key, hexToHSL(value, 'string'))
        })
        return newColors
      })
    },
    [lockedColors]
  )

  const toggleColorLock = useCallback((colorKey: string) => {
    setLockedColors((prevLockedColors) => {
      const newLockedColors = new Set(prevLockedColors)
      newLockedColors.has(colorKey)
        ? newLockedColors.delete(colorKey)
        : newLockedColors.add(colorKey)
      setLockedColors(newLockedColors)
      return newLockedColors
    })
  }, [])

  const handleColorChange = useCallback(
    (colorKey: string, newColor: string) => {
      // Update themeColors state
      console.log('colorKey', colorKey)
      console.log('newColor', newColor)
      setThemeColors((prevColors: ThemeVariables) => ({
        ...prevColors,
        [colorKey]: newColor,
      }))

      // Update colors state using the mapping object
      const colorVariableKey = colorVariableMapping[colorKey]
      console.log('colorVariableKey', colorVariableKey)
      if (colorVariableKey) {
        setColors((prevColors) => ({
          ...prevColors,
          [colorVariableKey]: newColor,
        }))
      }

      // Update theme state
      setTheme((prevTheme) => ({
        ...prevTheme,
        [colorKey]: newColor,
      }))

      // Update CSS variable
      var r = document.querySelector(':root') as any
      console.log('colorKey', colorKey)
      console.log('newColor', newColor)
      r.style.setProperty(colorKey, hexToHSL(newColor, 'string'))
    },
    []
  )

  const handleOtherChange = useCallback((variable: string, value: string) => {
    setThemeOtherVariables((prev: ThemeVariables) => ({
      ...prev,
      [variable]: value,
    }))
    var r = document.querySelector(':root') as any
    r.style.setProperty(variable, value)
  }, [])

  const setScheme = useCallback(
    (value: ColorScheme) => {
      setSchemeState(value)
      generateColors(isDark, baseHue, saturation, value, lockedColors)
    },
    [baseHue, generateColors, isDark, lockedColors, saturation]
  )

  const setIsDark = useCallback(
    (value: boolean) => {
      setIsDarkState(value)
      generateColors(value, baseHue, saturation, scheme, lockedColors)
    },
    [baseHue, generateColors, lockedColors, saturation, scheme]
  )

  const setBaseHue = useCallback(
    (value: number) => {
      setBaseHueState(value)
      generateColors(isDark, value, saturation, scheme, lockedColors)
    },
    [generateColors, isDark, lockedColors, saturation, scheme]
  )

  const setSaturation = useCallback(
    (value: number) => {
      setSaturationState(value)
      updateColorsWithSaturation(value)
    },
    [updateColorsWithSaturation]
  )

  const value = {
    themeColors,
    setThemeColors,
    themeOtherVariables,
    setThemeOtherVariables,
    isDark,
    setIsDark,
    baseHue,
    setBaseHue,
    setBaseHueState,
    saturation,
    setSaturation,
    setSaturationState,
    scheme,
    setScheme,
    setSchemeState,
    colors,
    setColors,
    lockedColors,
    setLockedColors,
    toggleColorLock,
    handleColorChange,
    generateColors,
    handleOtherChange,
    updateThemeOthers,
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
