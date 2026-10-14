package com.kitchi.web;

import com.kitchi.service.SpendingService;
import com.kitchi.web.dto.SpendingDtos.SavingsSummary;
import com.kitchi.web.dto.SpendingDtos.WeekDetail;
import com.kitchi.web.dto.SpendingDtos.WeekRow;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.time.LocalDate;
import java.util.List;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/v1")
@Tag(name = "Spending")
public class SpendingController {

    private final SpendingService spending;

    public SpendingController(SpendingService spending) {
        this.spending = spending;
    }

    @GetMapping("/spending/weeks")
    @Operation(summary = "Monday-to-Sunday spending rows, including weeks with no activity")
    public List<WeekRow> weeks(@RequestParam(defaultValue = "8") @Min(1) @Max(52) int count) {
        return spending.weeks(count);
    }

    @GetMapping("/spending/weeks/{weekStart}")
    @Operation(summary = "One week's totals plus its trips, eating-out entries, and cooked meals")
    public WeekDetail week(@PathVariable LocalDate weekStart) {
        return spending.week(weekStart);
    }

    @GetMapping("/savings/summary")
    @Operation(summary = "All-time savings, this week, last week, and the used-food streak")
    public SavingsSummary summary() {
        return spending.summary();
    }
}
