import { makeStyles } from '@material-ui/core/styles'

export const useStyles = makeStyles({
  addSignerForm: {
    background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
    padding: '1rem',
    [`& label`]: {
        display: 'block',
        marginTop: '1rem'
    },
    [`& input`]: {
        fontSize: '1rem',
        lineHeight: '1.5rem'
    },
  },
})
