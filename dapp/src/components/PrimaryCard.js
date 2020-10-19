import React from 'react'
import { Box, Card, CardContent, Icon, Typography } from '@material-ui/core'

import './PrimaryCard.css'

const PrimaryCard = (props) => {
  return (
    <Card className={`${props.onClick ? 'clickable ' : ''}primary-card`} onClick={props.onClick}>
      <CardContent>
        <Typography variant="h5" className="label">
          {props.head}
        </Typography>
        <Typography variant="h2" className="value">
          {props.detail}
        </Typography>
      </CardContent>
    </Card>
  )
}

export default PrimaryCard
