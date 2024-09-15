
# Academia API Backend

backend for fetching and extracting information from academia 


## API Reference

#### Fetching attendance

```http
  POST /api/attendance
```

#### Fetching callender

```http
  POST /api/calender
```

#### Fetching time table

```http
  POST /api/timetable
```

#### Fetching unified timetable

```http
  POST /api/unifiedtimetable?batch=1
```

| Parameter | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `batch`      | `int` | **Required**. batch for specific unified timetable |


